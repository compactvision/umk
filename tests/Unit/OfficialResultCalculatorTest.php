<?php

namespace Tests\Unit;

use App\Modules\Results\Application\ResultCalculator;
use PHPUnit\Framework\TestCase;

final class OfficialResultCalculatorTest extends TestCase
{
    public function test_exact_weighting_compensation_equivalence_and_period_totals(): void
    {
        $calculator = new ResultCalculator;
        $rules = $this->rules();
        $units = $this->units();
        $grades = [
            1 => [11 => $this->grade(14), 12 => $this->grade(12)],
            2 => [21 => $this->grade(9)],
            3 => [31 => $this->grade(16)],
        ];
        $direct = $calculator->calculate($rules, $units, $grades, [1 => true, 2 => true, 3 => true]);
        $this->assertSame('12.80', $direct['units'][0]['items'][0]['grade']);
        $this->assertSame('11.85', $direct['units'][0]['grade']);
        $this->assertSame('11.85', $direct['periods']['P1']['grade']);
        $this->assertSame('13.41', $direct['annual']);
        $this->assertSame(300, $direct['credits']['earned']);
        $this->assertSame(500, $direct['credits']['remaining']);

        $compensated = $calculator->calculate(array_replace($rules, ['compensation' => 'unit', 'compensation_floor' => 800]), $units, $grades, [1 => true, 2 => true, 3 => true]);
        $this->assertSame('compensated', $compensated['units'][0]['status']);
        $this->assertSame(500, $compensated['credits']['compensated']);
        $this->assertSame(800, $compensated['credits']['earned']);

        $recognized = $calculator->calculate($rules, $units, $grades, [1 => true, 2 => true], [3 => 'EQ-2026-03']);
        $this->assertSame('recognized', $recognized['units'][1]['status']);
        $this->assertSame(300, $recognized['credits']['recognized']);
        $this->assertSame(500, $recognized['credits']['registered']);
        $this->assertSame('11.85', $recognized['annual']);
    }

    public function test_zero_absence_and_missing_sources_have_different_results(): void
    {
        $calculator = new ResultCalculator;
        $rules = $this->rules() + ['eliminatory_below' => 300];
        $grades = [1 => [11 => $this->grade(0), 12 => $this->grade(0)], 2 => [21 => $this->grade(null, 'absent')]];
        $result = $calculator->calculate($rules, $this->units(), $grades, [1 => true, 2 => true, 3 => true]);
        $this->assertSame('0.00', $result['units'][0]['items'][0]['grade']);
        $this->assertTrue($result['eliminatory']);
        $this->assertNull($result['units'][0]['items'][1]['grade']);
        $this->assertSame('absent', $result['units'][0]['items'][1]['sources'][21]['participation']);
        $this->assertCount(2, $result['anomalies']);
        $this->assertNull($result['annual']);
    }

    public function test_resit_keeps_ordinary_acquisitions_and_applies_only_the_approved_policy(): void
    {
        $calculator = new ResultCalculator;
        $base = $calculator->calculate($this->rules(), $this->units(), [
            1 => [11 => $this->grade(14), 12 => $this->grade(12)],
            2 => [21 => $this->grade(9)], 3 => [31 => $this->grade(16)],
        ], [1 => true, 2 => true, 3 => true]);
        $ordinary = collect($base['units'])->flatMap(fn ($unit) => $unit['items'])->keyBy('id')->all();
        $rules = array_replace($this->rules(), ['base_rule_id' => 1, 'resit_policy' => 'replace', 'resit_eligibility' => 'failed_ec', 'missing_resit' => 'retain', 'items' => [1 => [], 2 => [50 => 10000], 3 => []]]);
        $result = $calculator->calculate($rules, $this->units(), [2 => [50 => $this->grade(10)]], [2 => true], ordinary: $ordinary);
        $this->assertSame('12.80', $result['units'][0]['items'][0]['grade']);
        $this->assertSame('ordinary', $result['units'][0]['items'][0]['selected']);
        $this->assertSame('10.00', $result['units'][0]['items'][1]['grade']);
        $this->assertSame(800, $result['credits']['earned']);

        $best = $calculator->calculate(array_replace($rules, ['resit_policy' => 'best']), $this->units(),
            [2 => [50 => $this->grade(7)]], [2 => true], ordinary: $ordinary);
        $this->assertSame('9.00', $best['units'][0]['items'][1]['grade']);
        $this->assertSame(300, $best['credits']['earned']);
    }

    private function rules(): array
    {
        return [
            'scale' => 2000, 'precision' => 2, 'rounding' => 'half_even', 'weighting' => 'credits', 'ec_pass' => 1000, 'ue_pass' => 1000,
            'compensation' => 'none', 'items' => [1 => [11 => 4000, 12 => 6000], 2 => [21 => 10000], 3 => [31 => 10000]],
        ];
    }

    private function units(): array
    {
        $item = fn ($id, $credits) => ['id' => $id, 'name' => "EC $id", 'code' => "EC$id", 'credits' => $credits, 'coefficient' => 1000, 'is_optional' => false];

        return [
            ['id' => 1, 'name' => 'UE1', 'code' => 'UE1', 'period_code' => 'P1', 'period_name' => 'Période 1', 'credits' => 500, 'credit_rule' => 'sum',
                'items' => [$item(1, 375), $item(2, 125)]],
            ['id' => 2, 'name' => 'UE2', 'code' => 'UE2', 'period_code' => 'P2', 'period_name' => 'Période 2', 'credits' => 300, 'credit_rule' => 'independent',
                'items' => [$item(3, 300)]],
        ];
    }

    private function grade(?int $value, string $participation = 'present'): array
    {
        return ['points' => $value === null ? null : $value * 100, 'maximum' => 2000, 'participation' => $participation];
    }
}
