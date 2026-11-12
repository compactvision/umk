<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicSemesterTest extends TestCase
{
    use RefreshDatabase;

    private function setupYear(): AcademicYear
    {
        $user = (new User)->forceFill(['first_name' => 'Admin', 'last_name' => 'Test', 'email' => 'admin@example.test', 'password' => 'password', 'email_verified_at' => now()]);
        $user->save(); $user->assignRole(Role::findOrCreate('admin', 'web')); $this->actingAs($user);
        return AcademicYear::create(['title' => '2026–2027', 'start_date' => '2026-10-15', 'end_date' => '2027-09-20', 'status' => 'open']);
    }

    private function savePeriod(AcademicYear $year, int $number, string $start, string $end)
    {
        return $this->post('/dashboard/admin/schedule/semesters', ['academic_year_id' => $year->id, 'number' => $number, 'start_month' => $start, 'end_month' => $end]);
    }

    public function test_month_periods_are_clipped_to_year_dates_and_can_be_saved_without_duplicates(): void
    {
        $year = $this->setupYear();
        $this->savePeriod($year, 1, '2026-10', '2027-03')->assertSessionHasNoErrors();
        $this->savePeriod($year, 2, '2027-04', '2027-09')->assertSessionHasNoErrors();
        $this->savePeriod($year, 1, '2026-10', '2027-03')->assertSessionHasNoErrors();
        $this->put('/dashboard/admin/academic-years/'.$year->id, ['title' => $year->title, 'start_date' => '2026-11-01', 'end_date' => '2027-09-20'])->assertSessionHasErrors('end_date');
        $this->assertDatabaseCount('academic_semesters', 2);
        $this->assertDatabaseHas('academic_semesters', ['number' => 1, 'start_date' => '2026-10-15 00:00:00', 'end_date' => '2027-03-31 00:00:00']);
        $second = AcademicSemester::where('number', 2)->firstOrFail();
        $this->assertSame('2027-09-20', $second->end_date->toDateString());

        $this->get(route('dashboard.admin.academic-years.semesters.index', ['academic_year_id' => $year->id]))
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/academicYear/Semesters')
                ->where('yearId', $year->id)->has('semesters', 2)->where('semesters.1.end_date', '2027-09-20'));
    }

    public function test_overlapping_reversed_and_out_of_year_periods_are_refused(): void
    {
        $year = $this->setupYear();
        $this->savePeriod($year, 1, '2026-09', '2027-03')->assertSessionHasErrors('start_month');
        $this->savePeriod($year, 1, '2027-03', '2026-10')->assertSessionHasErrors('end_month');
        $this->savePeriod($year, 1, '2026-10', '2027-03')->assertSessionHasNoErrors();
        $this->savePeriod($year, 2, '2027-03', '2027-09')->assertSessionHasErrors('start_month');
        $this->assertDatabaseCount('academic_semesters', 1);
    }

    public function test_first_and_last_day_bounds_use_kinshasa_midnight(): void
    {
        $year = $this->setupYear();
        $period = AcademicSemester::create(['academic_year_id' => $year->id, 'number' => 1, 'start_date' => '2026-11-01', 'end_date' => '2026-11-30']);
        $faculty = Faculty::create(['name' => 'Droit', 'code' => 'DR']);
        $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'L1', 'code' => 'L1']);
        $course = (new Courses)->forceFill(['level_id' => $level->id, 'title' => 'Cours de nuit', 'semester' => 1]); $course->save();
        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $level->id, 'academic_year_id' => $year->id, 'is_published' => true]);
        $payload = ['academic_offering_id' => $offering->id, 'starts_at' => '2026-11-01T00:00', 'ends_at' => '2026-11-01T01:00', 'room' => 'A', 'is_published' => true, 'repeat_count' => 1];
        $this->post('/dashboard/admin/schedule', $payload)->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/schedule', array_replace($payload, ['starts_at' => '2026-11-30T23:30', 'ends_at' => '2026-12-01T00:30']))->assertSessionHasErrors('starts_at');
        $this->assertDatabaseCount('academic_sessions', 1);
    }

    public function test_schedules_use_the_saved_period_and_ignore_client_date_overrides(): void
    {
        $year = $this->setupYear();
        $this->savePeriod($year, 1, '2026-11', '2026-11')->assertSessionHasNoErrors();
        $period = AcademicSemester::firstOrFail();
        $faculty = Faculty::create(['name' => 'Droit', 'code' => 'DR']);
        $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'L1', 'code' => 'L1']);
        $course = (new Courses)->forceFill(['level_id' => $level->id, 'title' => 'Droit civil', 'semester' => 1]); $course->save();
        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $level->id, 'academic_year_id' => $year->id, 'is_published' => true]);
        $this->post('/dashboard/admin/schedule/semester', ['academic_offering_id' => $offering->id, 'semester_id' => $period->id,
            'period_start' => '2026-01-01', 'period_end' => '2030-01-01', 'weekdays' => [1], 'start_time' => '08:00', 'end_time' => '10:00', 'room' => 'A', 'is_published' => true])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 5);
        $this->savePeriod($year, 1, '2026-12', '2026-12')->assertSessionHasErrors('end_month');
        $otherYear = AcademicYear::create(['title' => '2027–2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'closed']);
        $foreign = AcademicSemester::create(['academic_year_id' => $otherYear->id, 'number' => 1, 'start_date' => '2027-10-01', 'end_date' => '2028-03-31']);
        $this->post('/dashboard/admin/schedule/semester', ['academic_offering_id' => $offering->id, 'semester_id' => $foreign->id, 'weekdays' => [1], 'start_time' => '08:00', 'end_time' => '10:00', 'room' => 'B', 'is_published' => true])->assertSessionHasErrors('academic_offering_id');
    }
}
