<?php

namespace App\Modules\AcademicStructure\Application\Services;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\AdmissionCohort;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Database\Eloquent\Builder;

final class AnnualProgramPreparation
{
    public function __construct(private CurriculumService $curriculum) {}

    /** Runs inside the year opening transaction. */
    public function prepareYear(AcademicYear $year, ?int $actorId): void
    {
        $institutionId = University::where('context_key', 'current')->where('is_active', true)->value('id');
        if ($institutionId === null || ($year->university_id !== null && (int) $year->university_id !== (int) $institutionId)) {
            return;
        }

        $programs = AcademicProgram::openForAdmission()
            ->whereHas('faculty', fn ($query) => $query->where('university_id', $institutionId))
            ->with(['faculty', 'department', 'cycle', 'levels'])
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($programs as $program) {
            foreach ($program->levels->where('is_active', true) as $level) {
                $promotions = AcademicPromotion::where('academic_program_id', $program->id);
                $context = ['academic_program_id' => $program->id, 'academic_year_id' => $year->id, 'level_id' => $level->id];
                if ((clone $promotions)->where($context)->exists()) {
                    continue;
                }

                $promotion = AcademicPromotion::firstOrCreate($context, [
                    'code' => $this->availableCode($promotions, "ANNEE-{$year->id}-NIVEAU-{$level->id}"),
                    'name' => mb_substr("{$level->title} · {$program->name} · {$year->title}", 0, 255),
                ]);
                if ($promotion->wasRecentlyCreated) {
                    Audit::record($actorId, 'academic_promotion_created', $promotion, 'Préparation à l’ouverture de l’année académique.');
                }
            }

            $this->curriculum->ensureAnnualDraft($program, $year, $actorId);
        }
    }

    /** Runs inside the campaign transaction, with the institution and program locked. */
    public function ensureAdmissionCohort(AcademicProgram $program, AcademicYear $year, int $actorId): void
    {
        $cohorts = AdmissionCohort::where('academic_program_id', $program->id);
        if ((clone $cohorts)->where('academic_year_id', $year->id)->exists()) {
            return;
        }

        $cohort = AdmissionCohort::create([
            'academic_program_id' => $program->id,
            'academic_year_id' => $year->id,
            'code' => $this->availableCode($cohorts, "ENTREE-{$year->id}"),
            'name' => mb_substr("{$program->name} · Entrée {$year->title}", 0, 255),
        ]);
        Audit::record($actorId, 'admission_cohort_created', $cohort, 'Création à l’ouverture de la campagne d’admission.');
    }

    private function availableCode(Builder $records, string $base): string
    {
        $code = $base;
        for ($suffix = 2; (clone $records)->where('code', $code)->exists(); $suffix++) {
            $code = $base.'-'.$suffix;
        }

        return $code;
    }
}
