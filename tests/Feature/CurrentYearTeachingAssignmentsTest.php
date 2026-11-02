<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetail;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Modules\Teaching\Application\Services\CurrentYearTeachingAssignments;
use Database\Seeders\DemoProfessorsSeeder;
use Database\Seeders\ProposedCurriculaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CurrentYearTeachingAssignmentsTest extends TestCase
{
    use RefreshDatabase;

    private function prepare(): AcademicYear
    {
        $this->travelTo(\Carbon\Carbon::parse('2026-11-02 12:00', 'Africa/Kinshasa')->utc());
        foreach (['MED', 'SP', 'SSPA', 'DR', 'THEO'] as $code) {
            $faculty = Faculty::create(['name' => $code, 'code' => $code]);
            foreach ([1, 2, 3] as $number) {
                $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence '.$number, 'code' => 'L'.$number]);
                LevelDetail::create(['level_id' => $level->id, 'credit_required' => 60]);
            }
        }
        $this->seed([ProposedCurriculaSeeder::class, DemoProfessorsSeeder::class]);
        return AcademicYear::create(['title' => '2026–2027', 'start_date' => '2026-10-15', 'end_date' => '2027-09-15', 'status' => 'open']);
    }

    public function test_all_courses_are_matched_by_speciality_without_duplicates_or_changing_existing_scope(): void
    {
        $year = $this->prepare();
        $course = Courses::where('title', 'Anatomie générale')->firstOrFail();
        $wrong = Professor::where('speciality', 'Sociologie et méthodes de recherche')->firstOrFail();
        $existing = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $course->level_id, 'academic_year_id' => $year->id, 'professor_id' => $wrong->id, 'is_published' => false, 'group_leader_name' => 'Nom conservé']);
        $session = AcademicSession::create(['academic_offering_id' => $existing->id, 'starts_at' => '2026-11-03 08:00:00', 'ends_at' => '2026-11-03 10:00:00', 'room' => 'A']);
        $otherYear = AcademicYear::create(['title' => '2025–2026', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30', 'status' => 'closed']);
        $old = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $course->level_id, 'academic_year_id' => $otherYear->id, 'professor_id' => $wrong->id]);
        $plan = app(CurrentYearTeachingAssignments::class)->apply();
        $this->assertSame($year->id, $plan['year']['id']);
        $this->assertEquals(180, AcademicOffering::where('academic_year_id', $year->id)->count());
        $this->assertEquals(20, AcademicOffering::where('academic_year_id', $year->id)->distinct()->count('professor_id'));
        $matches = json_decode(file_get_contents(database_path('seeders/data/course-teaching-specialities.json')), true);
        foreach (AcademicOffering::where('academic_year_id', $year->id)->with(['course.level.faculty', 'professor'])->get() as $offering) {
            $key = $offering->course->level->faculty->code.':'.$offering->course->level->code.':'.$offering->course->title;
            $this->assertSame($matches[$key], $offering->professor->speciality);
            $this->assertEquals($offering->course->level_id, $offering->level_id);
        }
        $this->assertSame('Anatomie humaine et histologie', $existing->fresh()->professor->speciality);
        $this->assertFalse($existing->fresh()->is_published);
        $this->assertSame('Nom conservé', $existing->fresh()->group_leader_name);
        $this->assertSame($wrong->id, $old->fresh()->professor_id);
        $this->assertEquals($existing->id, $session->fresh()->academic_offering_id);
        $this->assertSame('2026-11-03 08:00:00', $session->fresh()->starts_at->format('Y-m-d H:i:s'));
        $again = app(CurrentYearTeachingAssignments::class)->apply();
        $this->assertTrue(collect($again['items'])->every(fn ($item) => $item['action'] === 'keep'));
        $this->assertDatabaseCount('academic_offerings', 181);
    }

    public function test_inactive_specialist_blocks_the_entire_import_without_partial_assignments(): void
    {
        $this->prepare();
        Professor::where('speciality', 'Anatomie humaine et histologie')->update(['is_active' => false]);
        try {
            app(CurrentYearTeachingAssignments::class)->apply();
            $this->fail('Le spécialiste inactif devait empêcher l’import.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('enseignant actif', $error->getMessage());
            $this->assertDatabaseCount('academic_offerings', 0);
        }
    }

    public function test_ambiguous_current_year_is_rejected(): void
    {
        $this->prepare();
        AcademicYear::create(['title' => 'Autre année ouverte', 'start_date' => '2026-01-01', 'end_date' => '2027-12-31', 'status' => 'open']);
        $this->expectException(\RuntimeException::class);
        app(CurrentYearTeachingAssignments::class)->apply();
    }

    public function test_rescheduling_is_never_used_to_hide_a_teacher_conflict(): void
    {
        $year = $this->prepare();
        $courses = Courses::whereIn('title', ['Anatomie générale', 'Histologie spéciale'])->get()->keyBy('title');
        $specialist = Professor::where('speciality', 'Anatomie humaine et histologie')->firstOrFail();
        foreach ($courses as $course) {
            $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $course->level_id, 'academic_year_id' => $year->id, 'professor_id' => $course->title === 'Histologie spéciale' ? $specialist->id : null]);
            AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => '2026-11-03 08:00:00', 'ends_at' => '2026-11-03 10:00:00', 'room' => $course->title]);
        }
        try {
            app(CurrentYearTeachingAssignments::class)->apply();
            $this->fail('Le conflit devait empêcher l’import.');
        } catch (\Illuminate\Validation\ValidationException $error) {
            $this->assertArrayHasKey('professor_id', $error->errors());
            $this->assertDatabaseCount('academic_offerings', 2);
            $this->assertDatabaseCount('academic_sessions', 2);
        }
    }
}
