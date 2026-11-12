<?php

namespace App\Modules\Progression\Application;

use App\Models\AcademicStructure\CurriculumUnit;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicLifecycleCase;
use App\Models\Student\AcademicOfficialResult;
use App\Modules\Results\Application\ResultInputs;
use App\Modules\Results\Application\ResultRules;
use Illuminate\Validation\ValidationException;

final class GraduationEvidence
{
    public function __construct(private ResultInputs $results) {}

    public function verify(AcademicEnrollment $entry, ?string $authorityReference): array
    {
        $final = $this->results->latest($entry);
        $version = $entry->curriculumVersion;
        $decision = $final?->run->context['decisions'][$final->decision] ?? [];
        ResultRules::check($final && $version?->published_at && $final->run->rule->approved_at && $final->run->rule->curriculum_version_id === $version->id
            && $final->run->rule->level_id === $entry->level_id && ! empty($decision['completion_credits'])
            && $final->snapshot['anomalies'] === [] && ! $final->snapshot['eliminatory'],
            'graduation', 'Une décision finale publiée, rattachée à la maquette et à un règlement de fin de cursus, est requise.');
        $levels = $version->program_snapshot['level_order'] ?? $version->program->levels()->pluck('levels.id')->all();
        $units = $version->units()->with('items')->get();
        ResultRules::check(end($levels) === $entry->level_id && ! array_diff($levels, $units->pluck('level_id')->all())
            && filled($version->program_snapshot['degree']), 'graduation', 'Le niveau final, le grade et la couverture complète de la maquette doivent être établis.');
        ResultRules::check(empty($decision['completion_evidence']) || filled($authorityReference), 'evidence',
            'Consignez la référence du contrôle institutionnel des exigences complémentaires.');

        $required = $units->filter(fn ($unit) => $unit->items->contains(fn ($item) => ! $item->is_optional));
        $unitIds = $units->pluck('id')->flip();
        $align = ($decision['completion_alignment'] ?? null) === 'identical_units';
        $versions = CurriculumVersion::where('academic_program_id', $version->academic_program_id)
            ->whereNotNull('published_at')->select('id');
        $published = AcademicOfficialResult::published()
            ->join('academic_enrollments', 'academic_enrollments.id', '=', 'academic_official_results.academic_enrollment_id')
            ->join('academic_deliberations', 'academic_deliberations.id', '=', 'academic_official_results.academic_deliberation_id')
            ->where('academic_enrollments.student_profile_id', $entry->student_profile_id)
            ->join('academic_years', 'academic_years.id', '=', 'academic_enrollments.academic_year_id')
            ->where('academic_years.start_date', '<=', $entry->academicYear->start_date)
            ->when($align, fn ($q) => $q->whereIn('academic_enrollments.curriculum_version_id', $versions),
                fn ($q) => $q->where('academic_enrollments.curriculum_version_id', $version->id))
            ->orderByDesc('academic_deliberations.published_at')->orderByDesc('academic_deliberations.id')
            ->get(['academic_official_results.*'])->unique('academic_enrollment_id');
        $aligned = [];
        if ($align) {
            $historicalIds = $published->flatMap(fn ($result) => array_column($result->snapshot['units'], 'id'))->unique()->diff($unitIds->keys());
            $target = $units->groupBy(fn ($unit) => $this->unitIdentity($unit))->filter(fn ($rows) => $rows->count() === 1);
            foreach (CurriculumUnit::whereIntegerInRaw('id', $historicalIds->all())->with('items')->get() as $old) {
                $match = $target->get($this->unitIdentity($old))?->first();
                if ($match) {
                    $aligned[$old->id] = $match->id;
                }
            }
        }
        $acquired = [];
        foreach ($published as $result) {
            foreach ($result->snapshot['units'] as $unit) {
                $targetId = $aligned[$unit['id']] ?? $unit['id'];
                if ($unitIds->has($targetId) && ! isset($acquired[$targetId])
                    && in_array($unit['status'], ['passed', 'compensated', 'recognized'], true)) {
                    $acquired[$targetId] = ['credits' => $unit['earned_credits'], 'result' => $result->reference, 'source_unit_id' => $unit['id']];
                }
            }
        }
        $credits = array_sum(array_column($acquired, 'credits'));
        ResultRules::check($required->isNotEmpty() && ! array_diff($required->modelKeys(), array_keys($acquired))
            && $credits >= $decision['completion_credits'], 'graduation',
            'Des UE obligatoires ou des crédits du cursus restent à certifier dans cette maquette. Faites publier les équivalences requises par Results.');

        return [
            'result_id' => $final->id, 'result_reference' => $final->reference, 'decision' => $final->decision,
            'rule_id' => $final->run->academic_result_rule_id, 'rule_reference' => $final->run->rule->reference,
            'curriculum_version_id' => $version->id, 'program_id' => $version->academic_program_id, 'degree' => $version->program_snapshot['degree'],
            'credits' => $credits, 'alignment' => $align ? 'identical_units' : 'exact_version', 'units' => $acquired, 'evidence' => $authorityReference,
        ];
    }

    private function unitIdentity(CurriculumUnit $unit): string
    {
        return hash('sha256', json_encode([
            $unit->level_id, $unit->period_code, $unit->code, $unit->credit_rule, $unit->expected_credits,
            $unit->items->sortBy('source_course_id')->values()->map(fn ($item) => $item->only([
                'source_course_id', 'credits', 'is_optional', 'coefficient', 'pedagogical_content', 'cmi_hours', 'td_hours', 'tp_hours',
            ]))->all(),
        ], JSON_THROW_ON_ERROR));
    }

    public function approved(AcademicEnrollment $entry, AcademicOfficialResult $result): ?AcademicLifecycleCase
    {
        $case = AcademicLifecycleCase::where('academic_enrollment_id', $entry->id)->where('completion_key', $result->id)
            ->where('kind', 'graduation')->where('status', 'approved')
            ->where('academic_official_result_id', $result->id)->first();
        if (! $case) {
            return null;
        }
        $approved = $case->context['completion'];
        try {
            return $this->verify($entry, $approved['evidence']) == $approved ? $case : null;
        } catch (ValidationException) {
            return null;
        }
    }
}
