<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Professor;
use App\Models\Student\AcademicResourceBlock;
use App\Models\Student\AcademicRoom;
use App\Models\Student\AcademicSession;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\ScheduleService;
use App\Modules\Teaching\Application\Services\TeachingTeam;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

final class ScheduleResourceController
{
    private function authorize(Request $request): void
    {
        abort_unless($request->user()->hasRole('admin') && $request->user()->can('publish academic content') && ! $request->user()->academicFaculties()->exists(), 403);
    }

    public function index(Request $request)
    {
        $this->authorize($request);
        $data = $request->validate(['q' => 'nullable|string|max:120']);

        return Inertia::render('dashboard/schedule/Resources', [
            'rooms' => AcademicRoom::when($data['q'] ?? null, fn ($q, $term) => $q->where(fn ($s) => $s
                ->where('name', 'like', '%'.$term.'%')->orWhere('code', 'like', '%'.$term.'%')->orWhere('campus', 'like', '%'.$term.'%')))
                ->orderBy('campus')->orderBy('building')->orderBy('code')->paginate(20)->withQueryString(),
            'blocks' => AcademicResourceBlock::with('room:id,code,name', 'professor:id,first_name,last_name')->latest('starts_at')->paginate(20, ['*'], 'blocks_page')->withQueryString(),
            'professors' => Professor::where('is_active', true)->orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'q' => $data['q'] ?? '',
        ]);
    }

    public function room(Request $request, ?AcademicRoom $room = null)
    {
        $this->authorize($request);
        $request->merge(['code' => mb_strtoupper(trim((string) $request->input('code')))]);
        $data = $request->validate([
            'code' => ['required', 'string', 'max:60', Rule::unique('academic_rooms', 'code')->ignore($room)],
            'name' => 'required|string|max:180', 'campus' => 'required|string|max:120', 'building' => 'required|string|max:120',
            'capacity' => 'required|integer|min:1|max:10000', 'type' => 'required|string|max:80',
            'equipment' => 'nullable|string|max:2000', 'instructions' => 'nullable|string|max:2000',
            'is_active' => 'required|boolean',
        ]);
        $data['name'] = preg_replace('/\s+/u', ' ', trim($data['name']));
        DB::transaction(function () use ($request, $data, $room) {
            AcademicYear::orderBy('id')->lockForUpdate()->first();
            if (! $room?->exists) {
                $room = AcademicRoom::create($data + ['university_id' => University::where('context_key', 'current')->value('id')]);
            } else {
                $room = AcademicRoom::lockForUpdate()->findOrFail($room->id);
                if ((! $data['is_active'] || (int) $data['capacity'] < $room->capacity) && $this->reservations($room)->whereNull('cancelled_at')->where('ends_at', '>', now())->exists()) {
                    throw ValidationException::withMessages(['capacity' => 'Déplacez les réservations à venir avant de désactiver la salle ou de réduire sa capacité.']);
                }
                $room->update($data);
            }
            Audit::record($request->user()->id, 'schedule_room_saved', $room);
        }, 3);

        return back(303)->with('success', 'Salle enregistrée.');
    }

    public function block(Request $request)
    {
        $this->authorize($request);
        $data = $request->validate([
            'academic_room_id' => 'required_without:professor_id|nullable|integer|exists:academic_rooms,id',
            'professor_id' => 'required_without:academic_room_id|nullable|integer|exists:professors,id',
            'starts_at' => 'required|date_format:Y-m-d\TH:i', 'ends_at' => 'required|date_format:Y-m-d\TH:i|after:starts_at',
            'reason' => 'required|string|min:5|max:500',
        ]);
        if (isset($data['academic_room_id'], $data['professor_id'])) {
            throw ValidationException::withMessages(['academic_room_id' => 'Sélectionnez une seule ressource.']);
        }
        $data['starts_at'] = CarbonImmutable::parse($data['starts_at'], 'Africa/Kinshasa')->utc();
        $data['ends_at'] = CarbonImmutable::parse($data['ends_at'], 'Africa/Kinshasa')->utc();
        DB::transaction(function () use ($request, $data) {
            AcademicYear::orderBy('id')->lockForUpdate()->first();
            $room = isset($data['academic_room_id']) ? AcademicRoom::findOrFail($data['academic_room_id']) : null;
            $conflicts = ($room ? $this->reservations($room) : AcademicSession::query())->whereNull('cancelled_at')
                ->where('starts_at', '<', $data['ends_at'])->where('ends_at', '>', $data['starts_at']);
            $busy = $room ? $conflicts->exists() : $conflicts->with('offering.assignments')->lazyById()->contains(
                fn ($session) => in_array((int) $data['professor_id'], TeachingTeam::idsAt($session->offering, $session->starts_at))
            );
            if ($busy) {
                throw ValidationException::withMessages(['starts_at' => 'Traitez les séances existantes avant de rendre la ressource indisponible.']);
            }
            $block = AcademicResourceBlock::firstOrCreate($data + ['released_at' => null], ['created_by' => $request->user()->id]);
            if ($block->wasRecentlyCreated) {
                Audit::record($request->user()->id, 'schedule_resource_blocked', $block);
            }
        }, 3);

        return back(303)->with('success', 'Indisponibilité enregistrée.');
    }

    private function reservations(AcademicRoom $room)
    {
        return AcademicSession::where(fn ($q) => $q->where('academic_room_id', $room->id)
            ->orWhere(fn ($legacy) => $legacy->whereNull('academic_room_id')->whereRaw('LOWER(room) IN (?, ?)', [ScheduleService::roomKey($room->name), ScheduleService::roomKey($room->code)])))
            ->whereHas('offering', fn ($q) => $q->whereNull('archived_at'));
    }

    public function release(Request $request, AcademicResourceBlock $block)
    {
        $this->authorize($request);
        DB::transaction(function () use ($request, $block) {
            AcademicYear::orderBy('id')->lockForUpdate()->first();
            $block = AcademicResourceBlock::lockForUpdate()->findOrFail($block->id);
            if (! $block->released_at) {
                $block->update(['released_at' => now()]);
                Audit::record($request->user()->id, 'schedule_resource_released', $block);
            }
        }, 3);

        return back(303)->with('success', 'Ressource libérée.');
    }
}
