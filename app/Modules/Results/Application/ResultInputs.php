<?php

namespace App\Modules\Results\Application;

use App\Models\Student\AcademicDeliberation;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\AcademicResultRule;
use App\Models\Student\AssessmentHandoff;
use App\Models\Student\CourseRegistration;
use Brick\Math\BigDecimal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class ResultInputs
{
    public function __construct(private ResultCalculator $calculator) {}

    public function roster(AcademicResultRule $rule): Builder
    {
        return AcademicEnrollment::where('curriculum_version_id', $rule->curriculum_version_id)
            ->where('level_id', $rule->level_id)->where('academic_year_id', $rule->version->academic_year_id)
            ->whereIn('enrollment_status', ['confirmed', 'completed'])->whereHas('application', fn ($application) => $application->where('status', 'validated'));
    }

    public function units(AcademicResultRule $rule): array
    {
        return $rule->version->units()->where('level_id', $rule->level_id)->with('items')->get()->map(fn ($unit) => [
            'id' => $unit->id, 'name' => $unit->name, 'code' => $unit->code,
            'period_code' => $unit->period_code, 'period_name' => $unit->period_name,
            'credits' => $this->scaled($unit->expected_credits, 100), 'credit_rule' => $unit->credit_rule,
            'items' => $unit->items->map(fn ($item) => [
                'id' => $item->id, 'name' => $item->name, 'code' => $item->code,
                'credits' => $this->scaled($item->credits, 100), 'coefficient' => $this->scaled($item->coefficient, 1000),
                'is_optional' => $item->is_optional,
            ])->all(),
        ])->all();
    }

    public function calculate(AcademicResultRule $rule, array $units, Collection $entries, array $equivalences): array
    {
        $configuration = $rule->configuration;
        $ids = $entries->modelKeys();
        $registrations = CourseRegistration::whereIn('academic_enrollment_id', $ids)->whereNull('withdrawn_at')
            ->whereHas('offering', fn ($offer) => $offer->where('academic_year_id', $rule->version->academic_year_id)
                ->whereHas('curriculumItem', fn ($item) => $item->where('curriculum_version_id', $rule->curriculum_version_id)))
            ->with('offering:id,curriculum_item_id')->get()->groupBy('academic_enrollment_id');
        $assessmentIds = collect($configuration['items'])->flatMap(fn ($weights) => array_keys($weights))->all();
        $handoffs = AssessmentHandoff::whereHas('record', fn ($record) => $record->whereIn('academic_enrollment_id', $ids)
            ->whereIn('academic_assessment_id', $assessmentIds)->where('correction_state', 'validated')
            ->whereColumn('academic_assessment_records.revision', 'academic_assessment_handoffs.revision'))
            ->with('record:id,academic_enrollment_id,academic_assessment_id')->orderBy('id')->get()->groupBy('record.academic_enrollment_id');
        $baseRule = $configuration['base_rule_id'] ?? null;
        $ordinaryRun = $baseRule ? AcademicDeliberation::where('academic_result_rule_id', $baseRule)->where('state', 'published')->latest('edition')->first() : null;
        if ($baseRule) {
            ResultRules::check($ordinaryRun !== null, 'rule', 'Publiez la session ordinaire avant le rattrapage.');
        }
        $ordinary = $ordinaryRun ? $ordinaryRun->results()->whereIn('academic_enrollment_id', $ids)->get()->keyBy('academic_enrollment_id') : collect();

        $results = [];
        foreach ($entries as $entry) {
            $ownRegistrations = $registrations->get($entry->id, collect());
            $registrationIds = $ownRegistrations->keyBy('id');
            $registered = $ownRegistrations->keyBy('offering.curriculum_item_id')->all();
            $grades = [];
            foreach ($handoffs->get($entry->id, collect()) as $handoff) {
                $source = $handoff->payload;
                $registration = $registrationIds->get($source['academic_course_registration_id'] ?? null);
                if (($source['schema_version'] ?? null) !== 1 || ! $registration
                    || $registration->academic_offering_id !== $source['academic_offering_id']
                    || $registration->offering->curriculum_item_id !== $source['curriculum_item_id']
                    || $source['academic_assessment_id'] !== $handoff->record->academic_assessment_id
                    || $source['academic_enrollment_id'] !== $entry->id || $source['student_profile_id'] !== $entry->student_profile_id
                    || $source['curriculum_version_id'] !== $rule->curriculum_version_id || $source['session_code'] !== $rule->session_code) {
                    continue;
                }
                $grades[$source['curriculum_item_id']][$source['academic_assessment_id']] = [
                    'handoff_id' => $handoff->id, 'result_key' => $source['result_key'], 'revision' => $handoff->revision,
                    'registration_id' => $registration->id, 'points' => $source['points_hundredths'],
                    'maximum' => $source['maximum_points_hundredths'], 'participation' => $source['participation'],
                ];
            }
            $prior = $ordinary->get($entry->id);
            $baseItems = $prior ? collect($prior->snapshot['units'])->flatMap(fn ($unit) => collect($unit['items'])->map(fn ($item) => $item + [
                'unit_acquired' => in_array($unit['status'], ['passed', 'compensated', 'recognized'], true),
            ]))->keyBy('id')->all() : [];
            $result = $this->calculator->calculate($configuration, $units, $grades, $registered, $equivalences[$entry->id] ?? [], $baseItems);
            if ($baseRule && ! $prior) {
                $result['anomalies'][] = 'Dossier ordinaire officiel absent.';
            }
            $results[$entry->id] = $result + [
                'student' => $entry->profile->user->full_name, 'matricule' => $entry->matricule ?? $entry->profile->matricule,
                'ordinary_reference' => $prior?->reference, 'ordinary_edition' => $ordinaryRun?->edition,
                'equivalences' => $equivalences[$entry->id] ?? [],
                'registrations' => $ownRegistrations->sortBy('id')->mapWithKeys(fn ($registration) => [$registration->id => $registration->offering->curriculum_item_id])->all(),
            ];
        }

        return $results;
    }

    public function latest(AcademicEnrollment $entry): ?AcademicOfficialResult
    {
        return AcademicOfficialResult::published()->where('academic_enrollment_id', $entry->id)
            ->join('academic_deliberations', 'academic_deliberations.id', '=', 'academic_official_results.academic_deliberation_id')
            ->orderByDesc('academic_deliberations.published_at')->orderByDesc('academic_deliberations.id')
            ->select('academic_official_results.*')->with('run.rule')->first();
    }

    private function scaled(?string $value, int $factor): ?int
    {
        return $value === null ? null : BigDecimal::of($value)->multipliedBy($factor)->toInt();
    }
}
