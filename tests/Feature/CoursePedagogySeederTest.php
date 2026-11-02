<?php

namespace Tests\Feature;

use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetail;
use Database\Seeders\CoursePedagogySeeder;
use Database\Seeders\ProposedCurriculaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoursePedagogySeederTest extends TestCase
{
    use RefreshDatabase;

    private function prepareCatalog(): void
    {
        foreach (['MED', 'SP', 'SSPA', 'DR', 'THEO'] as $code) {
            $faculty = Faculty::create(['name' => $code, 'code' => $code]);
            foreach ([1, 2, 3] as $year) {
                $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence '.$year, 'code' => 'L'.$year]);
                LevelDetail::create(['level_id' => $level->id, 'credit_required' => 60]);
            }
        }
        $this->seed(ProposedCurriculaSeeder::class);
    }

    public function test_all_180_courses_have_balanced_hours_and_subject_specific_outlines(): void
    {
        $this->prepareCatalog();
        $this->seed(CoursePedagogySeeder::class);
        $this->assertDatabaseCount('courses', 180);
        foreach (Courses::all() as $course) {
            $contact = $course->cmi_hours + $course->td_hours + $course->tp_hours;
            $this->assertEqualsWithDelta($course->credits * 25 * 2 / 3, $contact, .5);
            $this->assertLessThanOrEqual($course->credits * 25, $contact);
            $this->assertGreaterThanOrEqual(0, min($course->cmi_hours, $course->td_hours, $course->tp_hours));
            $this->assertStringContainsString($course->title, $course->pedagogical_content);
            $this->assertStringContainsString('4. ', $course->pedagogical_content);
            $this->assertStringContainsString('Travail personnel estimé', $course->pedagogical_content);
        }
        $anatomy = Courses::where('title', 'Anatomie générale')->firstOrFail();
        $this->assertStringContainsString('Ostéologie, arthrologie et myologie', $anatomy->pedagogical_content);
        $law = Courses::where('title', 'Procédure pénale')->firstOrFail();
        $this->assertStringContainsString('Enquête et garanties procédurales', $law->pedagogical_content);
        $stage = Courses::where('title', 'Stage pastoral supervisé')->firstOrFail();
        $this->assertGreaterThan($stage->cmi_hours, $stage->tp_hours);
    }

    public function test_rerun_preserves_manually_edited_hours_and_content_and_does_not_change_credits(): void
    {
        $this->prepareCatalog();
        $course = Courses::firstOrFail();
        $credits = $course->credits;
        $course->forceFill(['cmi_hours' => 20, 'pedagogical_content' => 'Plan validé par le titulaire.'])->save();
        $this->seed(CoursePedagogySeeder::class);
        $course->refresh();
        $snapshot = $course->only(['cmi_hours', 'td_hours', 'tp_hours', 'pedagogical_content', 'credits', 'updated_at']);
        $this->seed(CoursePedagogySeeder::class);
        $this->assertEquals($snapshot, $course->fresh()->only(array_keys($snapshot)));
        $this->assertEquals(20, $course->cmi_hours);
        $this->assertEquals($credits, $course->credits);
        $this->assertSame('Plan validé par le titulaire.', $course->pedagogical_content);
        $this->assertDatabaseCount('courses', 180);
    }
}
