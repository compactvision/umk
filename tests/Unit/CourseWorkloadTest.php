<?php

namespace Tests\Unit;

use App\Modules\Teaching\Application\Services\CourseWorkload;
use PHPUnit\Framework\TestCase;

class CourseWorkloadTest extends TestCase
{
    public function test_integer_rounding_never_loses_or_creates_hours_across_profiles_and_credit_values(): void
    {
        $calculator = new CourseWorkload;
        foreach (['theory', 'applied', 'lab', 'clinical', 'field', 'research'] as $profile) {
            foreach (range(0, 60) as $credits) {
                $hours = $calculator->allocate($credits, $profile);
                $this->assertSame($credits * 25, $hours['supervised_hours'] + $hours['personal_hours']);
                $this->assertSame($hours['supervised_hours'], $hours['cmi_hours'] + $hours['td_hours'] + $hours['tp_hours']);
                $this->assertGreaterThanOrEqual(0, min($hours['cmi_hours'], $hours['td_hours'], $hours['tp_hours'], $hours['personal_hours']));
            }
        }
    }

    public function test_practical_profiles_have_more_practical_hours_than_theoretical_profiles(): void
    {
        $calculator = new CourseWorkload;
        $theory = $calculator->allocate(6, 'theory');
        $lab = $calculator->allocate(6, 'lab');
        $field = $calculator->allocate(6, 'field');
        $this->assertGreaterThan($theory['tp_hours'], $lab['tp_hours']);
        $this->assertGreaterThan($lab['tp_hours'], $field['tp_hours']);
        $this->assertGreaterThan($lab['cmi_hours'], $theory['cmi_hours']);
    }

    public function test_zero_hours_are_preserved_and_remaining_fields_share_the_available_budget(): void
    {
        $hours = (new CourseWorkload)->allocate(4, 'lab', ['cmi_hours' => 0]);
        $this->assertSame(0, $hours['cmi_hours']);
        $this->assertSame(67, $hours['td_hours'] + $hours['tp_hours']);
    }

    public function test_inconsistent_existing_hours_are_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new CourseWorkload)->allocate(4, 'theory', ['cmi_hours' => 101]);
    }
}
