<?php

namespace Tests\Feature;

use App\Models\{Enrollment, EnrollmentDocument, EnrollmentEvent, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Storage};
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminEnrollmentManagementTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $email, bool $admin = false): User
    {
        $user = new User;
        $user->forceFill(['first_name' => 'Test', 'last_name' => 'Étudiant', 'email' => $email, 'password' => 'test-password', 'email_verified_at' => now()])->save();
        if ($admin) $user->assignRole(Role::findOrCreate('admin', 'web'));
        return $user;
    }

    private function dossier(User $student, string $status = 'submitted'): Enrollment
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Faculté ' . $student->id, 'code' => 'F' . DB::table('faculties')->count()]);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = DB::table('academic_years')->insertGetId(['title' => 'Année ' . DB::table('academic_years')->count(), 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        return Enrollment::create(['student_id' => $student->id, 'level_id' => $level, 'academic_year_id' => $year, 'status' => $status, 'form_snapshot' => ['name' => 'Nom déclaré', 'email' => $student->email, 'program' => 'Droit', 'isConfirmed' => true, 'cvv' => 'legacy-private-value']]);
    }

    private function document(Enrollment $dossier, string $contents = "%PDF-1.4\nTest document"): EnrollmentDocument
    {
        Storage::fake('local');
        $path = 'enrollments/' . $dossier->uuid . '/diploma.pdf';
        Storage::disk('local')->put($path, $contents);
        return EnrollmentDocument::create(['enrollment_id' => $dossier->id, 'type' => 'document', 'key' => 'diploma', 'disk' => 'local', 'path' => $path, 'filename' => 'Diplôme.pdf', 'mime' => 'application/pdf', 'size_bytes' => strlen($contents), 'sha256' => hash('sha256', $contents)]);
    }

    public function test_list_and_detail_show_real_data_without_private_storage_paths(): void
    {
        $admin = $this->user('admin@example.test', true);
        $student = $this->user('student@example.test');
        $dossier = $this->dossier($student);
        $doc = $this->document($dossier);
        $this->actingAs($admin)->get('/dashboard/admin/enrollments')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/adminEnrollments/Index')->has('enrollments.data', 1)
            ->where('enrollments.data.0.reference', $dossier->reference)
            ->where('stats.pending', 1)->where('enrollments.data.0.documents_count', 1)
            ->missing('enrollments.data.0.form_snapshot')
        );
        $this->get('/dashboard/admin/enrollments/' . $dossier->id)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/adminEnrollments/Show')->where('enrollment.snapshot.name', 'Nom déclaré')
            ->where('enrollment.reference', $dossier->reference)
            ->where('enrollment.documents.0.uuid', $doc->uuid)
            ->missing('enrollment.documents.0.path')->missing('enrollment.documents.0.disk')->missing('enrollment.snapshot.cvv')
        );
    }

    public function test_filters_apply_to_all_results_on_the_server(): void
    {
        $admin = $this->user('admin@example.test', true);
        $one = $this->dossier($this->user('find-me@example.test'));
        $this->dossier($this->user('other@example.test'), 'validated');
        $this->actingAs($admin)->get('/dashboard/admin/enrollments?'.http_build_query(['q' => $one->reference]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->where('enrollments.total', 1)->where('enrollments.data.0.id', $one->id));
        $this->actingAs($admin)->get('/dashboard/admin/enrollments?' . http_build_query(['q' => 'find-me', 'status' => 'submitted', 'faculty_id' => $one->level->faculty_id, 'year_id' => $one->academic_year_id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->where('enrollments.total', 1)->where('enrollments.data.0.id', $one->id)->where('stats.total', 2));
    }

    public function test_validation_records_actor_and_history_without_changing_payment(): void
    {
        $admin = $this->user('admin@example.test', true);
        $dossier = $this->dossier($this->user('student@example.test'));
        $this->actingAs($admin)->from('/dashboard/admin/enrollments/' . $dossier->id)->post('/dashboard/admin/enrollments/' . $dossier->id . '/validate')->assertRedirect()->assertSessionHasNoErrors();
        $fresh = $dossier->fresh();
        $this->assertSame('validated', $fresh->status->value);
        $this->assertNotNull($fresh->enrolled_at);
        $this->assertSame('unpaid', $fresh->payment_status->value);
        $this->assertSame($admin->id, $fresh->meta['validated_by']);
        $this->assertDatabaseHas('enrollment_events', ['enrollment_id' => $dossier->id, 'event' => 'validated', 'actor_id' => $admin->id]);
        $this->post('/dashboard/admin/enrollments/' . $dossier->id . '/validate')->assertSessionHasErrors('decision');
        $this->assertSame(1, $fresh->events()->where('event', 'validated')->count());
    }

    public function test_rejection_requires_a_reason_and_is_visible_to_the_student(): void
    {
        $admin = $this->user('admin@example.test', true);
        $student = $this->user('student@example.test');
        $dossier = $this->dossier($student, 'pending');
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/' . $dossier->id . '/reject', ['reason' => ' '])->assertSessionHasErrors('reason');
        $this->assertSame('pending', $dossier->fresh()->status->value);
        $this->post('/dashboard/admin/enrollments/' . $dossier->id . '/reject', ['reason' => 'Le diplôme transmis est illisible.'])->assertSessionHasNoErrors();
        $this->assertSame('rejected', $dossier->fresh()->status->value);
        $this->assertSame($admin->id, $dossier->fresh()->meta['rejected_by']);
        $this->actingAs($student)->get('/dashboard/enrollments/' . $dossier->uuid)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.reference', $dossier->reference)
            ->where('enrollment.rejection_reason', 'Le diplôme transmis est illisible.')
            ->where('enrollment.status_history.0.status', 'rejected')
            ->where('enrollment.status_history.0.notes', 'Le diplôme transmis est illisible.')
        );
    }

    public function test_drafts_and_terminal_states_cannot_be_decided_or_overwritten(): void
    {
        $admin = $this->user('admin@example.test', true);
        $student = $this->user('student@example.test');
        foreach (['draft', 'validated', 'rejected', 'cancelled'] as $status) {
            $dossier = $this->dossier($student, $status);
            foreach (['validate', 'reject'] as $action) {
                $this->actingAs($admin)->post('/dashboard/admin/enrollments/' . $dossier->id . '/' . $action, ['reason' => 'Motif de test'])->assertSessionHasErrors('decision');
                $this->assertSame($status, $dossier->fresh()->status->value);
            }
        }
        $this->assertSame(0, EnrollmentEvent::count());
    }

    public function test_admin_can_preview_and_download_private_documents(): void
    {
        $admin = $this->user('admin@example.test', true);
        $doc = $this->document($this->dossier($this->user('student@example.test')));
        $this->actingAs($admin)->get('/dashboard/admin/enrollments/documents/' . $doc->uuid . '/preview')->assertOk()->assertHeader('content-type', 'application/pdf')->assertHeader('x-content-type-options', 'nosniff');
        $this->get('/dashboard/admin/enrollments/documents/' . $doc->uuid . '/download')->assertOk()->assertDownload('Diplome.pdf');
        $preview = $this->get('/dashboard/admin/enrollments/documents/' . $doc->uuid . '/preview')->assertOk();
        $this->assertStringStartsWith('inline;', $preview->headers->get('Content-Disposition'));
        $this->assertStringContainsString('no-store', $preview->headers->get('Cache-Control'));
        Storage::disk('local')->delete($doc->path);
        $this->get('/dashboard/admin/enrollments/documents/' . $doc->uuid . '/preview')->assertNotFound();
    }

    public function test_active_content_cannot_be_previewed_as_a_pdf(): void
    {
        $admin = $this->user('admin@example.test', true);
        $doc = $this->document($this->dossier($this->user('student@example.test')), '<html><script>alert(1)</script></html>');
        $this->actingAs($admin)->get('/dashboard/admin/enrollments/documents/' . $doc->uuid . '/preview')->assertOk()->assertDownload('Diplome.pdf');
    }

    public function test_students_cannot_use_admin_actions_or_other_students_documents(): void
    {
        $student = $this->user('student@example.test');
        $dossier = $this->dossier($this->user('owner@example.test'));
        $doc = $this->document($dossier);
        $this->actingAs($student)->get('/dashboard/admin/enrollments')->assertForbidden();
        $this->get('/dashboard/admin/enrollments/' . $dossier->id)->assertForbidden();
        $this->post('/dashboard/admin/enrollments/' . $dossier->id . '/validate')->assertForbidden();
        $this->post('/dashboard/admin/enrollments/' . $dossier->id . '/reject', ['reason' => 'Test'])->assertForbidden();
        $this->get('/dashboard/admin/enrollments/documents/' . $doc->uuid . '/preview')->assertForbidden();
        $this->get('/dashboard/admin/enrollments/documents/' . $doc->uuid . '/download')->assertForbidden();
        $this->get('/dashboard/enrollments/documents/' . $doc->uuid . '/download')->assertForbidden();
        $this->get('/dashboard/enrollments/' . $dossier->uuid)->assertNotFound();
        $this->assertSame('submitted', $dossier->fresh()->status->value);
    }
}
