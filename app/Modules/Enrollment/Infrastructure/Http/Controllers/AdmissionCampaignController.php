<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\AdmissionCampaign;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Level;
use App\Modules\AcademicStructure\Application\Services\AnnualProgramPreparation;
use App\Modules\AcademicStructure\Application\Services\StructureService;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

final class AdmissionCampaignController
{
    public function index(Request $request)
    {
        $institution = University::where('context_key', 'current')->first();

        $filters = $request->validate(['level_id' => 'nullable|integer|exists:levels,id']);
        $level = isset($filters['level_id']) ? Level::findOrFail($filters['level_id'], ['id', 'title']) : null;
        $programs = AcademicProgram::whereHas('faculty', fn ($q) => $q->where('university_id', $institution?->id ?? -1));
        $campaigns = AdmissionCampaign::whereIn('academic_program_id', (clone $programs)->select('id'));

        if ($level) {
            $programs->whereHas('levels', fn ($q) => $q->whereKey($level->id));
            $campaigns->where('level_id', $level->id);
        }

        return Inertia::render('dashboard/adminEnrollments/Campaigns', [
            'level' => $level,
            'campaigns' => $campaigns->latest('id')->paginate(20)->withQueryString(),
            'programs' => $programs->with('levels:id,title')->orderBy('name')->get(['id', 'name']),
            'years' => AcademicYear::where(fn ($q) => $q->whereNull('university_id')->orWhere('university_id', $institution?->id ?? -1))->latest('start_date')->get(['id', 'title']),
            'success' => session('success'),
        ]);
    }

    public function save(Request $request, StructureService $structure, AnnualProgramPreparation $preparation)
    {
        $data = $request->validate([
            'academic_program_id' => 'required|integer', 'academic_year_id' => 'required|integer', 'level_id' => 'required|integer',
            'is_open' => 'required|boolean', 'opens_on' => 'nullable|date_format:Y-m-d', 'closes_on' => 'nullable|date_format:Y-m-d',
            'additional_documents' => 'nullable|string|max:2000', 'reason' => 'required|string|min:5|max:500',
        ]);
        $program = $structure->program($data['academic_program_id']);
        $year = $structure->year($data['academic_year_id']);
        if (! $program->levels->contains('id', (int) $data['level_id'])) {
            throw ValidationException::withMessages(['level_id' => 'Le niveau ne correspond pas au programme.']);
        }
        if (! empty($data['opens_on']) && ! empty($data['closes_on']) && $data['opens_on'] > $data['closes_on']) {
            throw ValidationException::withMessages(['closes_on' => 'La clôture doit suivre l’ouverture.']);
        }
        $documents = collect(preg_split('/\R/u', $data['additional_documents'] ?? ''))
            ->map(fn ($label) => trim($label))->filter()->unique()->values();
        if ($documents->count() > 15 || $documents->contains(fn ($label) => mb_strlen($label) > 120)) {
            throw ValidationException::withMessages(['additional_documents' => 'Indiquez au plus 15 pièces de 120 caractères chacune.']);
        }
        DB::transaction(function () use ($data, $program, $year, $documents, $request, $preparation) {
            University::whereKey($program->faculty->university_id)->lockForUpdate()->firstOrFail();
            $program->newQuery()->whereKey($program->id)->lockForUpdate()->firstOrFail();
            $campaign = AdmissionCampaign::updateOrCreate(
                ['academic_program_id' => $program->id, 'academic_year_id' => $data['academic_year_id'], 'level_id' => $data['level_id']],
                ['is_open' => $data['is_open'], 'opens_on' => $data['opens_on'] ?? null, 'closes_on' => $data['closes_on'] ?? null, 'additional_documents' => $documents->all()]
            );
            if ($campaign->is_open) {
                $preparation->ensureAdmissionCohort($program, $year, $request->user()->id);
            }
            Audit::record($request->user()->id, 'admission_campaign_updated', $campaign, $data['reason']);
        }, 3);

        return back()->with('success', 'Campagne enregistrée.');
    }
}
