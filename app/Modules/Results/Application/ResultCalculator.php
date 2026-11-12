<?php

namespace App\Modules\Results\Application;

use Brick\Math\BigRational;
use Brick\Math\RoundingMode;

final class ResultCalculator
{
    public const VERSION = 1;

    /**
     * Grades and credits enter as integer hundredths. Internal averages stay rational.
     * Only the presentation values are rounded.
     */
    public function calculate(array $rules, array $units, array $grades, array $registered, array $equivalences = [], array $ordinary = []): array
    {
        $output = [];
        $periods = [];
        $anomalies = [];
        $eliminatory = false;
        $credits = ['planned' => 0, 'registered' => 0, 'earned' => 0, 'compensated' => 0, 'recognized' => 0, 'remaining' => 0];
        foreach ($units as $unit) {
            $period = $unit['period_code'];
            $unitItems = [];
            $rawGrades = [];
            $itemWeight = 0;
            $itemCredits = 0;
            $creditMissing = false;
            $registeredCredits = 0;
            $credited = true;
            $hasEliminatory = false;
            $hasMissing = false;
            $recognitions = 0;
            $recognizedCredits = 0;
            foreach ($unit['items'] as $item) {
                $id = $item['id'];
                if ($item['is_optional'] && ! isset($registered[$id]) && ! isset($equivalences[$id]) && ! isset($ordinary[$id])) {
                    continue;
                }
                $creditMissing = $creditMissing || ($unit['credit_rule'] !== 'independent' && $item['credits'] === null);
                $itemCredits += $item['credits'] ?? 0;
                $registeredCredits += isset($registered[$id]) ? ($item['credits'] ?? 0) : 0;
                $equivalence = $equivalences[$id] ?? null;
                $result = $equivalence ? ['raw' => null, 'grade' => null, 'sources' => [], 'status' => 'recognized', 'recognition' => $equivalence]
                    : $this->item($rules, $id, $grades[$id] ?? [], $ordinary[$id] ?? null);
                $recognitions += (int) ($result['status'] === 'recognized');
                if ($result['status'] === 'recognized') {
                    $recognizedCredits += $item['credits'] ?? 0;
                }
                $credited = $credited && in_array($result['status'], ['passed', 'recognized'], true);
                $hasMissing = $hasMissing || $result['status'] === 'incomplete';
                $hasEliminatory = $hasEliminatory || $result['status'] === 'eliminatory';
                if (! $equivalence && ! isset($registered[$id]) && ($result['selected'] ?? null) !== 'ordinary') {
                    $result['status'] = 'incomplete';
                    $result['raw'] = $result['grade'] = null;
                    $hasMissing = true;
                }
                if ($result['raw'] !== null) {
                    $weight = match ($rules['weighting']) {
                        'credits' => $item['credits'], 'coefficients' => $item['coefficient'], default => 1
                    };
                    if ($weight === null || $weight <= 0) {
                        $hasMissing = true;
                        $anomalies[] = 'EC '.$item['name'].' · poids indisponible.';
                    } else {
                        $itemWeight += $weight;
                        $rawGrades[] = [BigRational::of($result['raw']), $weight];
                    }
                }
                $unitItems[] = $item + $result;
                if ($result['status'] === 'incomplete') {
                    $anomalies[] = 'EC '.$item['name'].' · source absente ou participation sans note.';
                }
            }
            if ($unitItems === []) {
                continue;
            }
            $planned = $unit['credit_rule'] === 'independent' ? $unit['credits'] : $itemCredits;
            if ($creditMissing || $planned === null) {
                $anomalies[] = 'UE '.$unit['name'].' · crédits indisponibles.';
                $hasMissing = true;
            }
            $planned ??= 0;
            $enrolled = $unit['credit_rule'] === 'independent' ? ($registeredCredits > 0 || collect($unitItems)->contains(fn ($item) => isset($registered[$item['id']])) ? $planned : 0) : $registeredCredits;
            $raw = $hasMissing ? null : $this->average($rawGrades);
            $canCompensate = $rules['compensation'] !== 'none' && $raw && ! $hasEliminatory
                && collect($unitItems)->every(fn ($item) => $item['raw'] === null || BigRational::of($item['raw'])->isGreaterThanOrEqualTo($rules['compensation_floor']));
            $recognized = $recognitions === count($unitItems);
            $passes = $recognized || ($credited && $raw && $raw->isGreaterThanOrEqualTo($rules['ue_pass']));
            $status = match (true) {
                $hasMissing => 'incomplete',
                $hasEliminatory => 'eliminatory',
                $recognized => 'recognized',
                (bool) $passes => 'passed',
                $canCompensate && $raw->isGreaterThanOrEqualTo($rules['ue_pass']) => 'compensated',
                default => 'failed',
            };
            if (! $hasMissing && ! $recognized && $raw === null) {
                $status = 'incomplete';
                $anomalies[] = 'UE '.$unit['name'].' · pondération indisponible.';
            }
            $periods[$period]['name'] = $unit['period_name'];
            $periods[$period]['units'][] = $unit['id'];
            $periods[$period]['weighted'][] = [$raw, match ($rules['weighting']) {
                'credits' => $planned, 'coefficients' => $itemWeight, default => 1
            }, $status];
            $eliminatory = $eliminatory || $hasEliminatory;
            $output[$unit['id']] = [
                'id' => $unit['id'], 'name' => $unit['name'], 'code' => $unit['code'], 'period_code' => $period, 'items' => $unitItems,
                'credits' => $planned, 'registered_credits' => $enrolled, 'raw' => $raw ? (string) $raw->simplified() : null,
                'grade' => $this->format($raw, $rules), 'status' => $status,
                'recognized_credits' => $unit['credit_rule'] === 'independent' ? ($recognized ? $planned : 0) : $recognizedCredits, 'compensable' => (bool) $canCompensate,
            ];
        }
        if ($output === []) {
            $anomalies[] = 'Aucune UE attendue dans ce dossier.';
        }
        $annual = [];
        foreach ($periods as $key => &$period) {
            $hasMissing = collect($period['weighted'])->contains(fn ($row) => $row[2] === 'incomplete');
            $raw = $hasMissing ? null : $this->average(array_filter($period['weighted'], fn ($row) => $row[0] !== null));
            if ($rules['compensation'] === 'period' && $raw && $raw->isGreaterThanOrEqualTo($rules['period_pass'])
                && ! collect($period['weighted'])->contains(fn ($row) => $row[2] === 'eliminatory')) {
                foreach ($period['units'] as $id) {
                    if ($output[$id]['status'] === 'failed' && $output[$id]['compensable']) {
                        $output[$id]['status'] = 'compensated';
                    }
                }
            }
            $period['grade'] = $this->format($raw, $rules);
            array_push($annual, ...array_filter($period['weighted'], fn ($row) => $row[0] !== null));
            unset($period['weighted']);
        }
        unset($period);
        foreach ($output as &$unit) {
            $credits['planned'] += $unit['credits'];
            $credits['registered'] += $unit['registered_credits'];
            $unit['earned_credits'] = in_array($unit['status'], ['passed', 'compensated', 'recognized'], true) ? $unit['credits'] : 0;
            $credits['earned'] += $unit['earned_credits'];
            $recognized = min($unit['earned_credits'], $unit['recognized_credits']);
            $credits['recognized'] += $recognized;
            if ($unit['status'] === 'compensated') {
                $credits['compensated'] += $unit['earned_credits'] - $recognized;
            }
            unset($unit['compensable']);
        }
        unset($unit);

        $credits['remaining'] = $credits['planned'] - $credits['earned'];

        return [
            'calculator' => self::VERSION, 'units' => array_values($output), 'periods' => $periods, 'credits' => $credits,
            'annual' => $this->format($anomalies === [] ? $this->average($annual) : null, $rules),
            'anomalies' => $anomalies, 'eliminatory' => $eliminatory,
        ];
    }

    private function item(array $rules, int $id, array $grades, ?array $ordinary): array
    {
        $weights = $rules['items'][$id];
        $rawGrades = [];
        $sources = [];
        foreach ($weights as $assessment => $weight) {
            $source = $grades[$assessment] ?? null;
            $sources[$assessment] = $source;
            if ($source && $source['maximum'] > 0 && $source['points'] !== null
                && in_array($source['participation'], ['submitted', 'late_submission', 'present', 'late'], true)
                && $source['points'] >= 0 && $source['points'] <= $source['maximum']) {
                $rawGrades[] = [BigRational::of($source['points'])->multipliedBy($rules['scale'])->dividedBy($source['maximum']), $weight];
            }
        }
        $new = count($rawGrades) === count($weights) ? $this->average($rawGrades) : null;
        $raw = $new;
        $selected = 'session';
        if (isset($rules['base_rule_id'])) {
            $base = isset($ordinary['raw']) ? BigRational::of($ordinary['raw']) : null;
            $ordinaryProtected = ($ordinary['status'] ?? null) === 'recognized' || match ($rules['resit_eligibility']) {
                'failed_ec' => ($ordinary['status'] ?? null) === 'passed',
                'failed_unit' => $ordinary['unit_acquired'] ?? false,
                default => false,
            };
            if ($ordinaryProtected || $weights === []
                || $rules['resit_policy'] === 'keep' || ($new === null && $rules['missing_resit'] === 'retain')
                || ($rules['resit_policy'] === 'best' && $base && $new && $base->isGreaterThan($new))) {
                $raw = $base;
                $selected = 'ordinary';
            }
            if ($selected === 'ordinary' && ($ordinary['status'] ?? null) === 'recognized') {
                return ['raw' => null, 'grade' => null, 'sources' => $sources, 'status' => 'recognized', 'selected' => $selected, 'recognition' => $ordinary['recognition']];
            }
        }
        $status = match (true) {
            $raw === null => 'incomplete',
            isset($rules['eliminatory_below']) && $raw->isLessThan($rules['eliminatory_below']) => 'eliminatory',
            $raw->isGreaterThanOrEqualTo($rules['ec_pass']) => 'passed',
            default => 'failed',
        };

        return ['raw' => $raw ? (string) $raw->simplified() : null, 'grade' => $this->format($raw, $rules), 'status' => $status,
            'sources' => $sources, 'selected' => $selected];
    }

    private function average(array $values): ?BigRational
    {
        $weight = array_sum(array_column($values, 1));
        if ($weight <= 0) {
            return null;
        }
        $sum = BigRational::zero();
        foreach ($values as [$value, $factor]) {
            $sum = $sum->plus($value->multipliedBy($factor))->simplified();
        }

        return $sum->dividedBy($weight)->simplified();
    }

    private function format(?BigRational $raw, array $rules): ?string
    {
        $mode = match ($rules['rounding']) {
            'half_up' => RoundingMode::HALF_UP, 'half_even' => RoundingMode::HALF_EVEN, 'down' => RoundingMode::DOWN
        };

        return $raw === null ? null : (string) $raw->dividedBy(100)->toScale($rules['precision'], $mode);
    }
}
