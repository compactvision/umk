<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicRoom;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Modules\Teaching\Application\Services\ScheduleService;
use App\Modules\Teaching\Application\Services\SemesterService;
use App\Modules\Teaching\Application\Services\SessionLifecycle;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function semesters(Request $request)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $filters = $request->validate(['academic_year_id' => 'nullable|integer|exists:academic_years,id']);
        $years = AcademicYear::orderByDesc('start_date')->get(['id', 'title', 'start_date', 'end_date', 'status']);
        $today = now('Africa/Kinshasa')->toDateString();
        $yearId = (int) ($filters['academic_year_id']
            ?? $years->first(fn ($year) => $year->start_date <= $today && $today <= $year->end_date)?->id
            ?? $years->first()?->id);

        return Inertia::render('dashboard/academicYear/Semesters', [
            'years' => $years,
            'yearId' => $yearId ?: null,
            'semesters' => $yearId ? AcademicSemester::where('academic_year_id', $yearId)->orderBy('number')->get() : [],
        ]);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $filters = $request->validate(['level_id' => 'nullable|integer|exists:levels,id', 'academic_year_id' => 'nullable|integer|exists:academic_years,id', 'semester' => 'nullable|integer|in:1,2', 'academic_room_id' => 'nullable|integer', 'professor_id' => 'nullable|integer', 'class_id' => 'nullable|integer', 'week' => 'nullable|date_format:Y-m-d']);
        $today = now('Africa/Kinshasa')->toDateString();
        $currentYear = AcademicYear::where('status', 'open')->where('start_date', '<=', $today)->where('end_date', '>=', $today)->orderByDesc('start_date')->first()
            ?? AcademicYear::where('status', 'open')->orderByDesc('start_date')->first()
            ?? AcademicYear::orderByDesc('start_date')->first();
        if (! isset($filters['academic_year_id']) && $currentYear) {
            $filters['academic_year_id'] = $currentYear->id;
        }
        $week = CarbonImmutable::parse($filters['week'] ?? now('Africa/Kinshasa')->toDateString(), 'Africa/Kinshasa')->startOfWeek();
        $scope = fn ($q) => $q->when($request->user()->academicFaculties()->exists(), fn ($q) => $q->whereHas('level', fn ($l) => $l->whereIn('faculty_id', $request->user()->academicFaculties()->select('faculties.id'))))->when($filters['level_id'] ?? null, fn ($q, $id) => $q->where('level_id', $id))
            ->when($filters['academic_year_id'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
            ->when($filters['class_id'] ?? null, fn ($q, $id) => $q->where('class_id', $id))
            ->when($filters['professor_id'] ?? null, fn ($q, $id) => $q->where(fn ($a) => $a->where('professor_id', $id)->orWhere('assistant_professor_id', $id)
                ->orWhereHas('assignments', fn ($team) => $team->where('professor_id', $id)->whereNull('ends_at'))))
            ->when($filters['semester'] ?? null, fn ($q, $semester) => $q->where(fn ($q) => $q->whereHas('academicSemester', fn ($s) => $s->where('number', $semester))->orWhere(fn ($legacy) => $legacy->whereNull('curriculum_item_id')->whereHas('course', fn ($c) => $c->where('semester', $semester)))));

        return Inertia::render('dashboard/schedule/Index', [
            'filters' => array_merge($filters, ['week' => $week->toDateString()]),
            'levels' => Level::with('faculty:id,name')->orderBy('faculty_id')->orderBy('code')->get(['id', 'faculty_id', 'title']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title', 'start_date', 'end_date', 'status']),
            'semesters' => AcademicSemester::orderBy('academic_year_id')->orderBy('number')->get(),
            'offerings' => $scope(AcademicOffering::query())->whereNull('archived_at')->with(['course:id,title,code,semester', 'professor:id,first_name,last_name', 'level.faculty:id,name', 'academicYear:id,title,start_date,end_date', 'academicSemester', 'curriculumItem.unit', 'group.intake', 'department:id,name'])->orderBy('course_id')->get(),
            'canManageRooms' => ! $request->user()->academicFaculties()->exists(),
            'canReviewAbsences' => $request->user()->can('manage academic access'),
            'rooms' => AcademicRoom::orderBy('code')->get(['id', 'code', 'name', 'campus', 'building', 'capacity', 'is_active']),
            'sessions' => AcademicSession::whereHas('offering', $scope)
                ->when($filters['academic_room_id'] ?? null, fn ($q, $id) => $q->where('academic_room_id', $id))
                ->where('starts_at', '<', $week->addWeek()->utc())->where('ends_at', '>', $week->utc())
                ->with(['successor:id,replaces_session_id,starts_at', 'offering.course', 'offering.professor', 'offering.level.faculty', 'offering.academicYear', 'offering.group.intake', 'offering.department:id,name'])
                ->orderBy('starts_at')->get(),
        ]);
    }

    public function save(Request $request, ScheduleService $service, ?int $session = null)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'academic_offering_id' => 'required|integer|exists:academic_offerings,id',
            'starts_at' => 'required|date_format:Y-m-d\TH:i',
            'ends_at' => 'required|date_format:Y-m-d\TH:i|after:starts_at',
            'academic_room_id' => 'nullable|integer|exists:academic_rooms,id',
            'activity_type' => 'nullable|string|max:80', 'reason' => 'nullable|string|max:1000',
            'excluded_dates' => 'sometimes|array|max:366', 'excluded_dates.*' => 'date_format:Y-m-d|distinct',
            'room' => 'nullable|string|max:180', 'is_published' => $session ? 'sometimes|boolean' : 'required|boolean',
            'repeat_count' => 'required|integer|min:1|max:'.($session ? '1' : '26'),
            'scope' => $session ? 'sometimes|in:session,semester' : 'prohibited',
        ]);
        if (($data['scope'] ?? null) === 'semester') {
            $count = $service->updateWeeklySlot($session, $data, $request->user()->id);

            return back()->with('success', $count === 1 ? 'Une séance du semestre modifiée.' : "{$count} séances du semestre modifiées.");
        }
        $count = $service->save($data, $request->user()->id, $session);

        return back()->with('success', $count > 1 ? "{$count} séances hebdomadaires enregistrées." : 'Séance enregistrée.');
    }

    public function saveSemester(Request $request, SemesterService $service)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'academic_year_id' => 'required|integer|exists:academic_years,id', 'number' => 'required|integer|in:1,2',
            'start_month' => 'required|date_format:Y-m', 'end_month' => 'required|date_format:Y-m|after_or_equal:start_month',
        ]);
        $service->save($data, $request->user()->id);

        return back()->with('success', 'Période du semestre enregistrée. Elle sera reprise automatiquement pour les horaires.');
    }

    public function semester(Request $request, ScheduleService $service)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'academic_offering_id' => 'required|integer|exists:academic_offerings,id',
            'semester_id' => 'required_without:slots|nullable|integer|exists:academic_semesters,id',
            'slots' => 'required_without:weekdays|array|list|min:1|max:21',
            'slots.*.weekday' => 'required|integer|between:1,7',
            'slots.*.start_time' => 'required|date_format:H:i',
            'slots.*.end_time' => 'required|date_format:H:i|after:slots.*.start_time',
            'slots.*.room' => 'nullable|string|max:180', 'slots.*.academic_room_id' => 'nullable|integer|exists:academic_rooms,id',
            'academic_room_id' => 'nullable|integer|exists:academic_rooms,id', 'activity_type' => 'nullable|string|max:80',
            'excluded_dates' => 'sometimes|array|max:366', 'excluded_dates.*' => 'date_format:Y-m-d|distinct',
            'weekdays' => 'required_without:slots|array|min:1|max:7',
            'weekdays.*' => 'required|integer|between:1,7|distinct',
            'start_time' => 'required_without:slots|date_format:H:i',
            'end_time' => 'required_without:slots|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:180', 'is_published' => 'required|boolean',
        ]);
        $count = $service->semester($data, $request->user()->id);

        return back()->with('success', "Horaire du semestre enregistré : {$count} séances planifiées.");
    }

    public function destroy(Request $request, ScheduleService $service, int $session)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate(['scope' => 'sometimes|in:session,semester']);
        $count = $service->delete($session, $request->user()->id, ($data['scope'] ?? null) === 'semester');

        return back()->with('success', $count === 1 ? 'Séance supprimée.' : "{$count} séances du semestre supprimées.");
    }

    public function history(Request $request, AcademicSession $session)
    {
        TeachingScope::authorize($request->user(), (int) $session->offering->level->faculty_id);

        return Inertia::render('dashboard/schedule/History', [
            'session' => $session->only(['id', 'starts_at', 'ends_at', 'room', 'cancelled_at', 'replaces_session_id']) + [
                'course' => $session->offering->curriculumItem?->name ?? $session->offering->course->title,
                'successor_id' => $session->successor()->value('id'),
            ],
            'events' => AcademicAudit::where('entity_type', 'academic_sessions')->where('entity_id', $session->id)
                ->with('actor:id,first_name,last_name')->latest('id')->paginate(25)->through(fn ($event) => [
                    'id' => $event->id, 'action' => $event->action, 'reason' => $event->reason, 'date' => $event->created_at,
                    'actor' => $event->actor?->full_name, 'changes' => $event->data,
                ]),
        ]);
    }

    public function transition(Request $request, AcademicSession $session, SessionLifecycle $lifecycle)
    {
        $input = $request->validate([
            'action' => 'required|in:validate,publish,cancel,reschedule,close_attendance',
            'reason' => 'required|string|min:5|max:1000',
            'starts_at' => 'required_if:action,reschedule|nullable|date_format:Y-m-d\TH:i',
            'ends_at' => 'required_if:action,reschedule|nullable|date_format:Y-m-d\TH:i|after:starts_at',
            'academic_room_id' => 'nullable|integer|exists:academic_rooms,id', 'room' => 'nullable|string|max:180',
        ]);
        $lifecycle->apply($session, $request->user(), $input);

        return back(303)->with('success', 'Décision de planification enregistrée.');
    }
}
