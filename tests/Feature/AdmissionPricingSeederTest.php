<?php

namespace Tests\Feature;

use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetail;
use Database\Seeders\AdmissionPricingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdmissionPricingSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_admissions_prices_apply_to_every_level_and_preserve_programme_data(): void
    {
        foreach (array_keys(AdmissionPricingSeeder::PLANS) as $code) {
            $faculty = Faculty::create(['name' => 'Faculté '.$code, 'code' => $code]);
            for ($year = 1; $year <= 3; $year++) {
                $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence '.$year, 'code' => 'L'.$year, 'image' => 'levels/cover.jpg', 'is_active' => false]);
                LevelDetail::create(['level_id' => $level->id, 'price' => 1, 'price_foreign' => 2, 'fees' => 99, 'language' => 'Français', 'course_objective' => 'Objectif conservé']);
            }
        }
        $this->seed(AdmissionPricingSeeder::class);
        $this->seed(AdmissionPricingSeeder::class);
        $this->assertDatabaseCount('levels', 15);
        $this->assertDatabaseCount('level_details', 15);
        foreach (Faculty::with('levels.detail')->get() as $faculty) {
            [$first, $second, $foreignFirst, $foreignSecond] = AdmissionPricingSeeder::PLANS[$faculty->code];
            foreach ($faculty->levels as $level) {
                $this->assertDatabaseHas('level_details', [
                    'level_id' => $level->id, 'price_national_first' => $first, 'price_national_second' => $second,
                    'price_foreign_first' => $foreignFirst, 'price_foreign_second' => $foreignSecond,
                    'price' => $first + $second, 'price_foreign' => $foreignFirst + $foreignSecond,
                    'fees' => 99, 'language' => 'Français', 'course_objective' => 'Objectif conservé',
                ]);
                $this->assertFalse((bool) $level->is_active);
                $this->assertSame('levels/cover.jpg', $level->image);
            }
        }
    }
}
