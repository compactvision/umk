<?php

namespace App\Modules\Progression\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOfficialResult;
use App\Modules\Results\Application\ResultInputs;

final class ProgressionEvidence
{
    public function __construct(private ResultInputs $results) {}

    public function evaluate(AcademicEnrollment $source, ?AcademicOfficialResult $result = null): array
    {
        $result ??= $this->results->latest($source);
        if (! $result) {
            return ['status' => 'awaiting_results', 'mode' => null, 'result' => null];
        }
        $decision = $result->run->context['decisions'][$result->decision] ?? [];
        $mode = $decision['progression'] ?? 'none';
        $snapshot = $result->snapshot;
        $consistent = $result->run->rule->curriculum_version_id === $source->curriculum_version_id
            && $result->run->rule->level_id === $source->level_id && $snapshot['anomalies'] === [] && ! $snapshot['eliminatory'];

        return [
            'status' => ! $consistent ? 'blocked' : ($mode === 'none' ? 'not_authorized' : 'eligible'),
            'mode' => $mode, 'result' => $result, 'decision' => $decision,
        ];
    }

    public function snapshot(AcademicEnrollment $source, AcademicOfficialResult $result, array $decision, ?string $due): array
    {
        $policy = $decision['retake'] ?? null;
        $items = [];
        if ($policy) {
            foreach ($result->snapshot['units'] as $unit) {
                $acquired = in_array($unit['status'], ['passed', 'compensated', 'recognized'], true);
                if ($policy === 'unacquired_units' && $acquired) {
                    continue;
                }
                foreach ($unit['items'] as $item) {
                    if ($item['status'] === 'recognized') {
                        continue;
                    }
                    $items[] = ['item_id' => $item['id'], 'unit_id' => $unit['id'], 'name' => $item['name'],
                        'unit' => $unit['name'], 'credits' => $item['credits'], 'initial_status' => $item['status']];
                }
            }
        }

        return [
            'curriculum_version_id' => $source->curriculum_version_id,
            'university_id' => $source->curriculumVersion?->program_snapshot['university_id'] ?? $source->level->faculty->university_id,
            'program_id' => $source->curriculumVersion?->academic_program_id,
            'result_reference' => $result->reference, 'decision' => $result->decision,
            'rule_id' => $result->run->academic_result_rule_id, 'rule_reference' => $result->run->rule->reference,
            'credits' => $result->snapshot['credits'], 'retake_policy' => $policy, 'retakes' => $items,
            'due_on' => $due, 'evaluated_at' => now()->toISOString(),
        ];
    }
}
