<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentEnrollmentPortalTest extends TestCase
{
    use RefreshDatabase;

    private function student(string $email = 'student@example.test'): User
    {
        $user = new User;
        $user->forceFill(['first_name' => 'Jean', 'post_name' => 'K.', 'last_name' => 'Test', 'email' => $email, 'password' => 'password', 'email_verified_at' => now()])->save();

        return $user;
    }

    private function entry(User $student, string $status = 'submitted'): Enrollment
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR'.DB::table('faculties')->count()]);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = DB::table('academic_years')->value('id') ?? DB::table('academic_years')->insertGetId(['title' => '2026–2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);

        return Enrollment::create(['student_id' => $student->id, 'level_id' => $level, 'academic_year_id' => $year, 'status' => $status, 'form_snapshot' => ['name' => 'Nom déclaré', 'email' => 'declared@example.test', 'cvv' => 'private']]);
    }

    public function test_cards_have_real_counts_and_only_owned_safe_data(): void
    {
        $student = $this->student();
        $entry = $this->entry($student);
        $this->entry($this->student('other@example.test'));
        foreach (['accepted', 'pending'] as $index => $status) {
            EnrollmentDocument::create(['enrollment_id' => $entry->id, 'key' => 'proof'.$index, 'type' => 'document', 'disk' => 'local', 'path' => 'private/proof'.$index.'.pdf', 'filename' => 'preuve.pdf', 'mime' => 'application/pdf', 'size_bytes' => 100, 'sha256' => str_repeat('a', 64), 'review_status' => $status, 'verified' => $status === 'accepted']);
        }
        $this->actingAs($student)->get('/dashboard/enrollments')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/enrollments/Index')->where('enrollments.total', 1)
            ->where('enrollments.data.0.reference', $entry->reference)->where('enrollments.data.0.documents_count', 2)
            ->where('enrollments.data.0.accepted_documents_count', 1)->where('stats.total', 1)->where('stats.in_progress', 1)
            ->missing('enrollments.data.0.form_snapshot')->missing('enrollments.data.0.meta')->missing('enrollments.data.0.documents'));
    }

    public function test_filters_search_all_owned_pages_and_stats_stay_global(): void
    {
        $student = $this->student();
        $first = $this->entry($student, 'draft');
        for ($index = 0; $index < 10; $index++) {
            $this->entry($student);
        }
        $this->actingAs($student)->get('/dashboard/enrollments')->assertOk()->assertInertia(fn (Assert $page) => $page->has('enrollments.data', 9)->where('enrollments.total', 11)->where('stats.draft', 1));
        $this->get('/dashboard/enrollments?'.http_build_query(['q' => $first->reference]))->assertOk()->assertInertia(fn (Assert $page) => $page->where('enrollments.total', 1)->where('enrollments.data.0.id', $first->id)->where('stats.total', 11));
        $this->get('/dashboard/enrollments?status=draft')->assertOk()->assertInertia(fn (Assert $page) => $page->where('enrollments.total', 1)->where('enrollments.data.0.status', 'draft'));
        $this->get('/dashboard/enrollments?status=made-up')->assertSessionHasErrors('status');
        $this->get('/dashboard/enrollments?status=submitted&page=2')->assertOk()->assertInertia(fn (Assert $page) => $page->has('enrollments.data', 1)->where('enrollments.total', 10));
    }

    public function test_detail_uses_declared_information_review_feedback_and_working_download(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('private/proof.pdf', '%PDF-1.4 test');
        $student = $this->student();
        $entry = $this->entry($student, 'pending');
        $doc = EnrollmentDocument::create(['enrollment_id' => $entry->id, 'key' => 'diploma', 'type' => 'document', 'disk' => 'local', 'path' => 'private/proof.pdf', 'filename' => 'preuve.pdf', 'mime' => 'application/pdf', 'size_bytes' => 13, 'sha256' => str_repeat('b', 64), 'review_status' => 'correction_requested', 'comment' => 'Copie illisible']);
        $entry->update(['meta' => ['analysis_started_at' => now()->toISOString(), 'correction_documents' => [$doc->uuid]]]);
        $entry->events()->create(['event' => 'document_reviewed', 'occurred_at' => now(), 'payload' => ['document_name' => 'preuve.pdf', 'verdict' => 'correction_requested', 'reason' => 'Copie illisible', 'private' => 'secret']]);
        $this->actingAs($student)->get('/dashboard/enrollments/'.$entry->uuid)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.reference', $entry->reference)->where('enrollment.declared_name', 'Nom déclaré')->where('enrollment.declared_email', 'declared@example.test')
            ->where('enrollment.academic_year.title', '2026–2027')->where('enrollment.student.post_name', 'K.')
            ->where('enrollment.documents.0.can_replace', true)->where('enrollment.documents.0.review_comment', 'Copie illisible')
            ->where('enrollment.status_history.0.document_name', 'preuve.pdf')->where('enrollment.status_history.0.verdict', 'correction_requested')
            ->missing('enrollment.form_snapshot')->missing('enrollment.documents.0.path')->missing('enrollment.status_history.0.payload'));
        $this->get('/dashboard/enrollments/documents/'.$doc->uuid.'/download')->assertOk()->assertDownload('preuve.pdf');
        $this->get('/dashboard/enrollments/documents/'.$doc->uuid.'/preview')->assertOk()->assertHeader('content-type', 'application/pdf')->assertHeader('x-content-type-options', 'nosniff');
        $this->actingAs($this->student('other@example.test'))->get('/dashboard/enrollments/'.$entry->uuid)->assertNotFound();
        $this->get('/dashboard/enrollments/documents/'.$doc->uuid.'/download')->assertForbidden();
        $this->get('/dashboard/enrollments/documents/'.$doc->uuid.'/preview')->assertForbidden();
        $this->actingAs($student);
        Storage::disk('local')->put('private/proof.pdf', '<html><script>alert(1)</script></html>');
        $this->get('/dashboard/enrollments/documents/'.$doc->uuid.'/preview')->assertOk()->assertDownload('preuve.pdf');
        Storage::disk('local')->delete('private/proof.pdf');
        $this->get('/dashboard/enrollments/documents/'.$doc->uuid.'/preview')->assertNotFound();
        $this->get('/dashboard/enrollments/documents/'.$doc->uuid.'/download')->assertNotFound();
    }

    public function test_only_owned_drafts_can_be_resumed(): void
    {
        $student = $this->student();
        $draft = $this->entry($student, 'draft');
        $submitted = $this->entry($student);
        $this->actingAs($student)->get('/dashboard/enrollments/'.$draft->uuid.'/edit')->assertOk()->assertInertia(fn (Assert $page) => $page->where('draft.uuid', $draft->uuid));
        $this->get('/dashboard/enrollments/'.$submitted->uuid.'/edit')->assertNotFound();
        $this->actingAs($this->student('other@example.test'))->get('/dashboard/enrollments/'.$draft->uuid.'/edit')->assertNotFound();
    }
}
