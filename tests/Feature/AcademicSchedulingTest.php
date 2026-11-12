<?php

namespace Tests\Feature;

use App\Models\AcademicCalendarEvent;
use App\Models\Courses;
use App\Models\Enrollment;
use App\Models\Professor;
use App\Models\Student\AbsenceJustification;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicRoom;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Notifications\AcademicScheduleNotice;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

final class AcademicSchedulingTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private const BASE = '/dashboard/admin/schedule';

    private const REASON = 'Décision motivée du service académique.';

    private function fixture(): array
    {
        $this->travelTo(Carbon::parse('2026-11-01 08:00', 'Africa/Kinshasa'));
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->sole();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $course = new Courses;
        $course->forceFill(['level_id' => $entry->level_id, 'title' => 'Programmation', 'semester' => 1, 'credits' => 3])->save();
        AcademicSemester::create(['academic_year_id' => $entry->academic_year_id, 'number' => 1, 'start_date' => '2026-11-01', 'end_date' => '2027-03-31']);
        $offering = AcademicOffering::create(['level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id,
            'course_id' => $course->id, 'is_published' => true]);

        return [$admin, $student, $entry, $offering];
    }

    private function payload(AcademicOffering $offer, array $changes = []): array
    {
        return array_replace(['academic_offering_id' => $offer->id, 'starts_at' => '2026-11-02T08:00',
            'ends_at' => '2026-11-02T10:00', 'repeat_count' => 1, 'is_published' => false, 'room' => 'Auditoire de test'], $changes);
    }

    private function room(array $changes = []): array
    {
        return array_replace(['code' => 'A-01', 'name' => 'Auditoire de test', 'campus' => 'Centre', 'building' => 'A',
            'capacity' => 30, 'type' => 'Auditoire', 'is_active' => true], $changes);
    }

    public function test_rooms_are_registered_with_capacity_and_blocks_and_free_text_cannot_bypass_a_block(): void
    {
        [$admin,,, $offer] = $this->fixture();
        $this->actingAs($admin)->post(self::BASE.'/rooms', $this->room(['capacity' => 0]))->assertSessionHasErrors('capacity');
        $this->post(self::BASE.'/rooms', $this->room())->assertStatus(303);
        $room = AcademicRoom::sole();
        $this->post(self::BASE.'/blocks', ['academic_room_id' => $room->id, 'starts_at' => '2026-11-02T08:30',
            'ends_at' => '2026-11-02T11:00', 'reason' => 'Maintenance planifiée.'])->assertStatus(303);
        $this->post(self::BASE, $this->payload($offer, ['room' => 'a-01']))->assertSessionHasErrors('starts_at');
        $id = DB::table('academic_resource_blocks')->value('id');
        $this->post(self::BASE.'/blocks/'.$id.'/release')->assertStatus(303);
        $this->post(self::BASE, $this->payload($offer, ['academic_room_id' => $room->id]))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('academic_sessions', ['academic_room_id' => $room->id, 'room' => $room->name]);
        $this->put(self::BASE.'/rooms/'.$room->id, $this->room(['is_active' => false]))->assertSessionHasErrors('capacity');
        $this->get(self::BASE.'/resources')->assertInertia(fn (Assert $page) => $page->component('dashboard/schedule/Resources')->where('rooms.data.0.capacity', 30));
    }

    public function test_capacity_and_teacher_unavailability_are_enforced_for_the_same_audience(): void
    {
        [$admin,,, $offer] = $this->fixture();
        $student = User::factory()->create();
        $profile = StudentProfile::create(['user_id' => $student->id, 'student_status' => 'active']);
        $application = Enrollment::create(['student_id' => $student->id, 'level_id' => $offer->level_id, 'academic_year_id' => $offer->academic_year_id, 'status' => 'validated']);
        AcademicEnrollment::create(['student_profile_id' => $profile->id, 'application_id' => $application->id,
            'level_id' => $offer->level_id, 'academic_year_id' => $offer->academic_year_id, 'enrollment_status' => 'confirmed', 'currency' => 'USD']);
        $teacher = Professor::create(['first_name' => 'Anne', 'last_name' => 'Test', 'email' => 'scheduling-block@example.test', 'is_active' => true]);
        $offer->update(['professor_id' => $teacher->id]);
        $this->actingAs($admin)->post(self::BASE.'/rooms', $this->room(['capacity' => 1]))->assertStatus(303);
        $room = AcademicRoom::sole();
        $this->post(self::BASE, $this->payload($offer, ['academic_room_id' => $room->id]))->assertSessionHasErrors('academic_room_id');
        $this->put(self::BASE.'/rooms/'.$room->id, $this->room())->assertStatus(303);
        $this->post(self::BASE.'/blocks', ['professor_id' => $teacher->id, 'starts_at' => '2026-11-02T07:00',
            'ends_at' => '2026-11-02T09:00', 'reason' => 'Indisponibilité du responsable.'])->assertStatus(303);
        $this->post(self::BASE, $this->payload($offer, ['academic_room_id' => $room->id]))->assertSessionHasErrors('starts_at');
        $this->post(self::BASE, $this->payload($offer, ['academic_room_id' => $room->id, 'starts_at' => '2026-11-02T09:00']))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 1);
    }

    public function test_same_named_rooms_at_distinct_locations_can_be_reserved_concurrently(): void
    {
        [$admin,,, $offer] = $this->fixture();
        $this->actingAs($admin)->post(self::BASE.'/rooms', $this->room())->assertStatus(303);
        $this->post(self::BASE.'/rooms', $this->room(['code' => 'B-01', 'campus' => 'Annexe']))->assertStatus(303);
        $other = AcademicOffering::create(['level_id' => DB::table('levels')->insertGetId([
            'faculty_id' => $offer->level->faculty_id, 'code' => 'L2', 'title' => 'Niveau distinct',
        ]), 'course_id' => $offer->course_id, 'academic_year_id' => $offer->academic_year_id, 'is_published' => true]);
        $rooms = AcademicRoom::orderBy('id')->get();
        $this->post(self::BASE, $this->payload($offer, ['academic_room_id' => $rooms[0]->id]))->assertSessionHasNoErrors();
        $this->post(self::BASE, $this->payload($other, ['academic_room_id' => $rooms[0]->id]))->assertSessionHasErrors('starts_at');
        $this->post(self::BASE, $this->payload($other, ['academic_room_id' => $rooms[1]->id]))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_sessions', 2);
    }

    public function test_weekly_generation_excludes_holidays_and_is_idempotent_and_preserves_past_occurrences(): void
    {
        [$admin,,, $offer] = $this->fixture();
        AcademicCalendarEvent::create(['academic_year_id' => $offer->academic_year_id, 'title' => 'Congé', 'category' => 'holiday', 'start_date' => '2026-11-09', 'end_date' => '2026-11-09']);
        $input = $this->payload($offer, ['repeat_count' => 4, 'excluded_dates' => ['2026-11-23'], 'is_published' => true]);
        $this->actingAs($admin)->post(self::BASE, $input)->assertSessionHasNoErrors();
        $this->post(self::BASE, $input)->assertSessionHasNoErrors();
        $sessions = AcademicSession::orderBy('starts_at')->get();
        $this->assertCount(2, $sessions);
        $this->assertNotNull($sessions[0]->recurrence_id);
        $this->assertSame($sessions[0]->recurrence_id, $sessions[1]->recurrence_id);
        $this->assertSame(['2026-11-02', '2026-11-16'], $sessions->map(fn ($s) => $s->starts_at->toDateString())->all());
        $this->travelTo(Carbon::parse('2026-11-10 08:00', 'Africa/Kinshasa'));
        $edit = $this->payload($offer, ['scope' => 'semester', 'room' => 'Salle modifiée', 'starts_at' => '2026-11-02T09:00', 'ends_at' => '2026-11-02T11:00']);
        unset($edit['is_published']);
        $this->put(self::BASE.'/'.$sessions[0]->id, $edit)->assertSessionHasNoErrors();
        $this->assertSame('Auditoire de test', $sessions[0]->fresh()->room);
        $this->assertSame('Salle modifiée', $sessions[1]->fresh()->room);
    }

    public function test_publication_report_and_cancellation_preserve_the_chain_and_deduplicate_notices(): void
    {
        [$admin, $student, $entry, $offer] = $this->fixture();
        $this->actingAs($admin)->post(self::BASE, $this->payload($offer))->assertSessionHasNoErrors();
        $original = AcademicSession::sole();
        $url = self::BASE.'/'.$original->id.'/transition';
        $this->post($url, ['action' => 'publish', 'reason' => self::REASON])->assertSessionHasErrors('action');
        $this->post($url, ['action' => 'validate', 'reason' => self::REASON])->assertStatus(303);
        $this->post($url, ['action' => 'publish', 'reason' => self::REASON])->assertStatus(303);
        $this->post($url, ['action' => 'publish', 'reason' => self::REASON])->assertStatus(303);
        $move = ['action' => 'reschedule', 'reason' => self::REASON, 'starts_at' => '2026-11-03T08:00', 'ends_at' => '2026-11-03T10:00', 'room' => 'Salle B'];
        $this->post($url, $move)->assertStatus(303);
        $this->post($url, $move)->assertStatus(303);
        $replacement = $original->successor()->sole();
        $this->assertDatabaseCount('academic_sessions', 2);
        $this->assertSame('2026-11-02 07:00:00', $original->fresh()->starts_at->toDateTimeString());
        $this->assertNotNull($original->fresh()->cancelled_at);
        $this->assertSame('Salle B', $replacement->room);
        $this->post(self::BASE.'/'.$replacement->id.'/transition', ['action' => 'cancel', 'reason' => self::REASON])->assertStatus(303);
        $this->delete(self::BASE.'/'.$original->id)->assertSessionHasErrors('session');
        $this->assertSame(3, $student->notifications()->where('type', AcademicScheduleNotice::class)->count());
        $this->actingAs($student)->get('/dashboard/student/schedule?week=2026-11-02&academic='.$entry->id)
            ->assertInertia(fn (Assert $page) => $page->has('sessions', 2)->where('sessions.0.status', 'rescheduled')->where('sessions.1.status', 'cancelled'));
    }

    public function test_failed_report_rolls_back_the_original_reservation(): void
    {
        [$admin,,, $offer] = $this->fixture();
        $this->actingAs($admin)->post(self::BASE, $this->payload($offer, ['is_published' => true]))->assertSessionHasNoErrors();
        $first = AcademicSession::sole();
        $this->post(self::BASE, $this->payload($offer, ['starts_at' => '2026-11-03T08:00', 'ends_at' => '2026-11-03T10:00']))->assertSessionHasNoErrors();
        $this->post(self::BASE.'/'.$first->id.'/transition', ['action' => 'reschedule', 'reason' => self::REASON,
            'starts_at' => '2026-11-03T08:00', 'ends_at' => '2026-11-03T10:00'])->assertSessionHasErrors('starts_at');
        $this->assertNull($first->fresh()->cancelled_at);
        $this->assertDatabaseCount('academic_sessions', 2);
    }

    public function test_authorized_teacher_records_attendance_and_closed_correction_requires_current_revision(): void
    {
        [$admin,, $entry, $offer] = $this->fixture();
        $account = User::factory()->create();
        $account->assignRole(Role::findOrCreate('professor', 'web'));
        $account->givePermissionTo(Permission::findOrCreate('manage students', 'web'));
        $professor = Professor::create(['first_name' => 'Anne', 'last_name' => 'Test', 'email' => $account->email, 'is_active' => true]);
        $professor->forceFill(['user_id' => $account->id, 'photo' => 'professors/test-portrait.png'])->save();
        $session = $offer->sessions()->create(['starts_at' => '2026-11-01 01:00:00', 'ends_at' => '2026-11-01 02:00:00', 'room' => 'A', 'is_published' => true]);
        $teacher = '/dashboard/teacher/sessions/'.$session->id.'/attendance';
        $this->actingAs($account)->get($teacher)->assertForbidden();
        $offer->update(['professor_id' => $professor->id]);
        $row = ['records' => [['id' => $entry->id, 'status' => 'absent']], 'revision' => 0];
        $this->post($teacher, $row)->assertSessionHasNoErrors();
        $this->post($teacher, $row)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_attendances', 1);
        $this->assertSame(1, $session->fresh()->attendance_revision);
        $this->actingAs($admin)->post(self::BASE.'/'.$session->id.'/transition', ['action' => 'close_attendance', 'reason' => self::REASON])->assertStatus(303);
        $row['records'][0]['status'] = 'late';
        $this->actingAs($account)->post($teacher, $row)->assertForbidden();
        $staff = self::BASE.'/'.$session->id.'/attendance';
        $this->actingAs($admin)->post($staff, $row)->assertSessionHasErrors('reason');
        $this->post($staff, $row + ['reason' => self::REASON])->assertSessionHasErrors('revision');
        $row['revision'] = 1;
        $this->post($staff, $row + ['reason' => self::REASON])->assertSessionHasNoErrors();
        $this->assertSame('late', AcademicAttendance::sole()->status);
    }

    public function test_justification_correction_and_acceptance_preserve_absence_and_private_document(): void
    {
        [$admin, $student, $entry, $offer] = $this->fixture();
        Storage::fake('local');
        $session = $offer->sessions()->create(['starts_at' => '2026-11-01 01:00:00', 'ends_at' => '2026-11-01 02:00:00', 'room' => 'A', 'is_published' => true]);
        $record = AcademicAttendance::create(['academic_session_id' => $session->id, 'academic_enrollment_id' => $entry->id, 'status' => 'absent', 'recorded_by' => $admin->id]);
        $submit = '/dashboard/student/absences/'.$record->id;
        $this->actingAs($student)->post($submit, ['reason' => 'Motif confidentiel pour le service.'])->assertStatus(303);
        $case = AbsenceJustification::sole();
        $decision = self::BASE.'/absences/'.$case->id.'/decision';
        $this->actingAs($admin)->post($decision, ['status' => 'correction', 'revision' => 1, 'reason' => 'Ajoutez une pièce justificative.'])->assertStatus(303);
        $this->actingAs($student)->post($submit, ['reason' => 'Pièce complémentaire jointe.', 'revision' => 2,
            'file' => UploadedFile::fake()->createWithContent('preuve.pdf', "%PDF-1.4\n%%EOF")])->assertStatus(303);
        $file = '/dashboard/student/absences/'.$case->id.'/file';
        $response = $this->get($file)->assertOk();
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $stranger = User::factory()->create();
        $stranger->assignRole('student');
        $this->actingAs($stranger)->get($file)->assertNotFound();
        $this->actingAs($admin)->post($decision, ['status' => 'accepted', 'revision' => 3, 'reason' => 'Justificatif vérifié.'])->assertStatus(303);
        $this->post($decision, ['status' => 'refused', 'revision' => 3, 'reason' => 'Tentative avec une version obsolète.'])->assertSessionHasErrors('status');
        $this->assertSame('absent', $record->fresh()->status);
        $this->assertSame('accepted', $case->fresh()->status);
        $this->assertSame(1, count($case->fresh()->submission_history));
        $this->get(self::BASE.'/reports?student='.$entry->id)->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/schedule/Reports')->where('total.recorded', 1)->where('total.excused', 1)->where('total.absent', 0));
        $this->get(self::BASE.'/reports?format=csv')->assertDownload('presences.csv');
    }
}
