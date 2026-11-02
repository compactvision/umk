<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Models\User;
use App\Modules\Teaching\Application\Services\DemoYearSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoYearScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_slot_is_kept_and_only_missing_hours_are_added(): void
    {
        $year = AcademicYear::create(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $actor = (new User)->forceFill(['email' => 'demo-actor@example.test', 'first_name' => 'Démo', 'last_name' => 'Admin', 'password' => 'password']);
        $actor->save();
        $faculty = Faculty::create(['code' => 'DR', 'name' => 'Droit']);
        $level = Level::create(['faculty_id' => $faculty->id, 'code' => 'L1', 'title' => 'Licence 1']);
        $teacher = Professor::create(['first_name' => 'Prof', 'last_name' => 'Fictif', 'email' => 'prof@example.test', 'is_active' => true]);
        $course = (new Courses)->forceFill(['level_id' => $level->id, 'title' => 'Cours test', 'credits' => 1, 'semester' => 1, 'cmi_hours' => 4, 'td_hours' => 0, 'tp_hours' => 0]);
        $course->save();
        AcademicSemester::create(['academic_year_id' => $year->id, 'number' => 1, 'start_date' => '2026-10-01', 'end_date' => '2027-03-31']);
        $offering = AcademicOffering::create(['academic_year_id' => $year->id, 'level_id' => $level->id, 'course_id' => $course->id, 'professor_id' => $teacher->id]);
        $old = AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => '2026-10-05 08:00:00', 'ends_at' => '2026-10-05 09:00:00', 'room' => 'Salle conservée', 'is_published' => false]);
        $items = collect([$offering]);
        $this->assertSame(2, app(DemoYearSchedule::class)->generate($year, $items, $actor->id));
        $this->assertSame('Salle conservée', $old->fresh()->room);
        $this->assertFalse($old->fresh()->is_published);
        $minutes = AcademicSession::all()->sum(fn ($session) => ($session->ends_at->getTimestamp() - $session->starts_at->getTimestamp()) / 60);
        $this->assertEquals(240, $minutes);
        $this->assertSame(0, app(DemoYearSchedule::class)->generate($year, $items, $actor->id));
        $this->assertDatabaseCount('academic_sessions', 3);
    }
}
