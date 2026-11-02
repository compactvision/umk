<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ScheduleModuleTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'admin'): User
    {
        $user = (new User)->forceFill(['first_name' => 'Test', 'last_name' => 'Planning', 'email' => uniqid().'@example.test', 'password' => 'password', 'email_verified_at' => now()]);
        $user->save(); $user->assignRole(Role::findOrCreate($role, 'web'));
        return $user;
    }

    private function offering(?Level $level = null, ?AcademicYear $year = null, ?Professor $professor = null, ?int $group = null): AcademicOffering
    {
        if (!$level) {
            $faculty = Faculty::create(['name' => 'Faculté '.uniqid(), 'code' => uniqid()]);
            $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence 1', 'code' => 'L1']);
        }
        $year ??= AcademicYear::firstOrCreate(['title' => '2026–2027'], ['start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        \App\Models\Student\AcademicSemester::firstOrCreate(['academic_year_id' => $year->id, 'number' => 1], ['start_date' => '2026-10-01', 'end_date' => '2027-03-31']);
        $course = (new Courses)->forceFill(['level_id' => $level->id, 'title' => 'Cours '.uniqid(), 'credits' => 6, 'semester' => 1]); $course->save();
        return AcademicOffering::create(['course_id' => $course->id, 'level_id' => $level->id, 'academic_year_id' => $year->id, 'professor_id' => $professor?->id, 'class_id' => $group, 'is_published' => true]);
    }

    private function payload(AcademicOffering $offering, array $extra = []): array
    {
        return array_replace(['academic_offering_id' => $offering->id, 'starts_at' => '2026-11-02T08:00', 'ends_at' => '2026-11-02T10:00', 'room' => 'Auditoire A', 'is_published' => true, 'repeat_count' => 1], $extra);
    }

    public function test_weekly_creation_stores_utc_and_can_be_filtered_edited_and_deleted(): void
    {
        $offering = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule', $this->payload($offering, ['repeat_count' => 3]))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 3);
        $session = AcademicSession::orderBy('starts_at')->firstOrFail();
        $this->assertSame('2026-11-02 07:00:00', $session->starts_at->format('Y-m-d H:i:s'));
        $this->get('/dashboard/admin/schedule?week=2026-11-03&level_id='.$offering->level_id)->assertOk()->assertInertia(fn (Assert $p) => $p->component('dashboard/schedule/Index')->where('filters.week', '2026-11-02')->has('sessions', 1));
        $this->put('/dashboard/admin/schedule/'.$session->id, $this->payload($offering, ['room' => 'Auditoire B', 'is_published' => false]))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('academic_sessions', ['id' => $session->id, 'room' => 'Auditoire B', 'is_published' => false]);
        $this->delete('/dashboard/admin/schedule/'.$session->id)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 2);
    }

    public function test_conflicts_for_rooms_teachers_and_levels_are_rejected_even_in_draft(): void
    {
        $teacher = Professor::create(['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => 'anne@example.test']);
        $first = $this->offering(professor: $teacher); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule', $this->payload($first, ['is_published' => false]))->assertSessionHasNoErrors();
        $other = $this->offering();
        $this->post('/dashboard/admin/schedule', $this->payload($other, ['room' => '  auditoire   a  ']))->assertSessionHasErrors('starts_at');
        $sameTeacher = $this->offering(professor: $teacher);
        $this->post('/dashboard/admin/schedule', $this->payload($sameTeacher, ['room' => 'Salle B']))->assertSessionHasErrors('starts_at');
        $sameLevel = $this->offering($first->level);
        $this->post('/dashboard/admin/schedule', $this->payload($sameLevel, ['room' => 'Salle C']))->assertSessionHasErrors('starts_at');
        $this->post('/dashboard/admin/schedule', $this->payload($sameLevel, ['starts_at' => '2026-11-02T10:00', 'ends_at' => '2026-11-02T12:00']))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 2);
    }

    public function test_repetition_rolls_back_entirely_when_a_later_week_conflicts(): void
    {
        $first = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule', $this->payload($first, ['starts_at' => '2026-11-09T08:00', 'ends_at' => '2026-11-09T10:00']))->assertSessionHasNoErrors();
        $other = $this->offering();
        $this->post('/dashboard/admin/schedule', $this->payload($other, ['repeat_count' => 3]))->assertSessionHasErrors('starts_at');
        $this->assertDatabaseCount('academic_sessions', 1);
    }

    public function test_year_boundaries_and_invalid_intervals_are_rejected(): void
    {
        $offering = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule', $this->payload($offering, ['ends_at' => '2026-11-02T07:00']))->assertSessionHasErrors('ends_at');
        $this->post('/dashboard/admin/schedule', $this->payload($offering, ['starts_at' => '2027-09-27T08:00', 'ends_at' => '2027-09-27T10:00', 'repeat_count' => 2]))->assertSessionHasErrors('starts_at');
        $this->post('/dashboard/admin/schedule', $this->payload($offering, ['repeat_count' => 27]))->assertSessionHasErrors('repeat_count');
        $this->assertDatabaseCount('academic_sessions', 0);
    }

    public function test_distinct_groups_can_meet_concurrently_but_common_courses_cannot_overlap(): void
    {
        $first = $this->offering();
        $group = function ($name) use ($first) {
            $intake = DB::table('intakes')->insertGetId(['name' => $name]);
            return Classes::create(['faculty_id' => $first->level->faculty_id, 'level_id' => $first->level_id, 'intake_id' => $intake])->id;
        };
        $first->update(['class_id' => $group('Groupe A')]);
        $second = $this->offering($first->level, group: $group('Groupe B'));
        $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule', $this->payload($first))->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/schedule', $this->payload($second, ['room' => 'Salle B']))->assertSessionHasNoErrors();
        $common = $this->offering($first->level);
        $this->post('/dashboard/admin/schedule', $this->payload($common, ['room' => 'Salle C']))->assertSessionHasErrors('starts_at');
    }

    public function test_reassigning_an_already_scheduled_course_checks_teacher_availability(): void
    {
        $teacher = Professor::create(['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => 'anne@example.test']);
        $first = $this->offering(professor: $teacher); $other = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule', $this->payload($first))->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/schedule', $this->payload($other, ['room' => 'Salle B']))->assertSessionHasNoErrors();
        $this->put('/dashboard/admin/professors/assignments/'.$other->id, ['course_id' => $other->course_id, 'academic_year_id' => $other->academic_year_id, 'professor_id' => $teacher->id, 'is_published' => true])->assertSessionHasErrors('professor_id');
    }

    private function semesterPayload(AcademicOffering $offering, array $extra = []): array
    {
        $values = array_replace(['academic_offering_id' => $offering->id, 'semester' => 1,
            'period_start' => '2026-11-01', 'period_end' => '2026-11-16', 'weekdays' => [1],
            'start_time' => '08:00', 'end_time' => '10:00', 'room' => 'Auditoire A', 'is_published' => true], $extra);
        $period = \App\Models\Student\AcademicSemester::updateOrCreate(['academic_year_id' => $offering->academic_year_id, 'number' => $values['semester']], ['start_date' => $values['period_start'], 'end_date' => $values['period_end']]);
        return $values + ['semester_id' => $period->id];
    }

    public function test_semester_plan_generates_only_selected_weekdays_inclusively(): void
    {
        $offering = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule/semester', $this->semesterPayload($offering, ['weekdays' => [1, 3]]))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 5);
        $this->assertSame(['2026-11-02 07:00', '2026-11-04 07:00', '2026-11-09 07:00', '2026-11-11 07:00', '2026-11-16 07:00'], AcademicSession::orderBy('starts_at')->get()->map(fn ($s) => $s->starts_at->format('Y-m-d H:i'))->all());
        $this->get('/dashboard/admin/schedule?week=2026-11-02&semester=1')->assertInertia(fn (Assert $p) => $p->has('sessions', 2)->has('offerings', 1));
        $this->get('/dashboard/admin/schedule?week=2026-11-02&semester=2')->assertInertia(fn (Assert $p) => $p->has('sessions', 0)->has('offerings', 0));
    }

    public function test_semester_plan_is_atomic_if_the_last_occurrence_conflicts(): void
    {
        $offering = $this->offering(); $other = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule', $this->payload($other, ['starts_at' => '2026-11-16T08:00', 'ends_at' => '2026-11-16T10:00']))->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/schedule/semester', $this->semesterPayload($offering))->assertSessionHasErrors('starts_at');
        $this->assertDatabaseCount('academic_sessions', 1);
    }

    public function test_semester_plan_rejects_wrong_semester_empty_days_and_invalid_periods(): void
    {
        $offering = $this->offering(); $this->actingAs($this->user());
        $url = '/dashboard/admin/schedule/semester';
        $this->post($url, $this->semesterPayload($offering, ['semester' => 2]))->assertSessionHasErrors('academic_offering_id');
        $this->post($url, $this->semesterPayload($offering, ['weekdays' => []]))->assertSessionHasErrors('weekdays');
        $this->post($url, $this->semesterPayload($offering, ['period_start' => '2026-11-03', 'period_end' => '2026-11-04']))->assertSessionHasErrors('weekdays');
        $this->post($url, $this->semesterPayload($offering, ['period_end' => '2027-10-01']))->assertSessionHasErrors('period_start');
        $this->post($url, $this->semesterPayload($offering, ['end_time' => '07:00']))->assertSessionHasErrors('end_time');
        $this->assertDatabaseCount('academic_sessions', 0);
    }

    private function slotsPayload(AcademicOffering $offering, array $slots): array
    {
        return array_diff_key($this->semesterPayload($offering), array_flip(['weekdays', 'start_time', 'end_time', 'room'])) + ['slots' => $slots];
    }

    public function test_a_course_can_meet_on_monday_morning_and_wednesday_afternoon_in_different_rooms(): void
    {
        $offering = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule/semester', $this->slotsPayload($offering, [
            ['weekday' => 1, 'start_time' => '08:00', 'end_time' => '10:00', 'room' => 'Salle A'],
            ['weekday' => 3, 'start_time' => '16:00', 'end_time' => '18:00', 'room' => 'Salle B'],
        ]))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 5);
        $this->assertDatabaseHas('academic_sessions', ['starts_at' => '2026-11-02 07:00:00', 'ends_at' => '2026-11-02 09:00:00', 'room' => 'Salle A']);
        $this->assertDatabaseHas('academic_sessions', ['starts_at' => '2026-11-04 15:00:00', 'ends_at' => '2026-11-04 17:00:00', 'room' => 'Salle B']);
    }

    public function test_two_distinct_slots_on_the_same_day_are_allowed_but_overlaps_roll_back_everything(): void
    {
        $offering = $this->offering(); $this->actingAs($this->user());
        $slots = [
            ['weekday' => 1, 'start_time' => '08:00', 'end_time' => '10:00', 'room' => 'Salle A'],
            ['weekday' => 1, 'start_time' => '09:00', 'end_time' => '11:00', 'room' => 'Salle B'],
        ];
        $this->post('/dashboard/admin/schedule/semester', $this->slotsPayload($offering, $slots))->assertSessionHasErrors('slots.1.start_time');
        $this->assertDatabaseCount('academic_sessions', 0);
        $slots[1]['start_time'] = '14:00'; $slots[1]['end_time'] = '16:00';
        $this->post('/dashboard/admin/schedule/semester', $this->slotsPayload($offering, $slots))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 6);
    }

    public function test_each_dynamic_slot_requires_its_own_valid_times_and_room(): void
    {
        $offering = $this->offering(); $this->actingAs($this->user());
        $this->post('/dashboard/admin/schedule/semester', $this->slotsPayload($offering, [
            ['weekday' => 1, 'start_time' => '08:00', 'end_time' => '10:00', 'room' => 'A'],
            ['weekday' => 3, 'start_time' => '16:00', 'end_time' => '15:00', 'room' => ''],
        ]))->assertSessionHasErrors(['slots.1.end_time', 'slots.1.room']);
        $this->assertDatabaseCount('academic_sessions', 0);
    }

    public function test_student_cannot_manage_the_schedule(): void
    {
        $this->actingAs($this->user('student'));
        $this->post('/dashboard/admin/schedule/semester', [])->assertForbidden();
        $this->get('/dashboard/admin/schedule')->assertForbidden();
        $this->post('/dashboard/admin/schedule', [])->assertForbidden();
        $this->put('/dashboard/admin/schedule/1', [])->assertForbidden();
        $this->delete('/dashboard/admin/schedule/1')->assertForbidden();
    }
}
