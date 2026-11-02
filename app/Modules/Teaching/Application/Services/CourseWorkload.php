<?php

namespace App\Modules\Teaching\Application\Services;

use InvalidArgumentException;

class CourseWorkload
{
    // Editorial workload convention: 25 h/credit, approximately 2/3 supervised.
    // Reference: MESU, Annuaire des descripteurs UE (pedagogy and applied techniques).
    // https://minesursi.gouv.cd/images/Annuaire%20alphabtique%20des%20descripteurs%20des%20UE%20PEDAGOGIE%20ET%20TECHNIQUES%20APPLIQUEES.pdf
    private const WEIGHTS = [
        'theory' => [60, 25, 15], 'applied' => [45, 35, 20],
        'lab' => [35, 20, 45], 'clinical' => [25, 20, 55],
        'field' => [15, 15, 70], 'research' => [20, 30, 50],
    ];

    public function allocate(int $credits, string $profile, array $existing = []): array
    {
        if ($credits < 0 || $credits > 60 || !isset(self::WEIGHTS[$profile])) {
            throw new InvalidArgumentException('Crédits ou profil pédagogique invalides.');
        }
        $fields = ['cmi_hours', 'td_hours', 'tp_hours'];
        $total = $credits * 25;
        $target = (int) round($total * 2 / 3);
        $values = [];
        $weights = [];
        foreach ($fields as $index => $field) {
            $value = $existing[$field] ?? null;
            if ($value !== null) {
                if ((int) $value < 0) throw new InvalidArgumentException('Un volume horaire ne peut pas être négatif.');
                $values[$field] = (int) $value;
            } else {
                $weights[$field] = self::WEIGHTS[$profile][$index];
            }
        }
        $known = array_sum($values);
        if ($known > $total || ($weights && $known > $target)) {
            throw new InvalidArgumentException('Les heures déjà saisies dépassent la charge proposée. Vérifiez le cours avant de le compléter.');
        }
        if ($weights) {
            $remaining = $target - $known;
            $sumWeights = array_sum($weights);
            $fractions = [];
            foreach ($weights as $field => $weight) {
                $raw = $remaining * $weight / $sumWeights;
                $values[$field] = (int) floor($raw);
                $fractions[$field] = $raw - floor($raw);
            }
            arsort($fractions, SORT_NUMERIC);
            $rounding = $target - array_sum($values);
            foreach (array_keys($fractions) as $field) {
                if ($rounding-- <= 0) break;
                $values[$field]++;
            }
        }
        return $values + ['total_hours' => $total, 'supervised_hours' => array_sum($values), 'personal_hours' => $total - array_sum($values)];
    }
}
