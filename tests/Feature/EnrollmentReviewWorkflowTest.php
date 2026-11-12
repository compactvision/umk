<?php

namespace Tests\Feature;

use App\Mail\EnrollmentReviewUpdated;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EnrollmentReviewWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh', ['--force' => true]);
        \Illuminate\Foundation\Testing\RefreshDatabaseState::$migrated = false;
    }

    private function fixture(): array
    {
        Mail::fake();
        Storage::fake('local');
        $users = [];
        foreach (['admin', 'student', 'other'] as $name) {
            $user = new User;
            $user->forceFill(['first_name' => $name, 'last_name' => 'Test', 'email' => $name.'@example.test', 'password' => 'password', 'email_verified_at' => now()])->save();
            $users[] = $user;
        }
        [$admin, $student, $other] = $users;
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = DB::table('academic_years')->insertGetId(['title' => '2026–2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $entry = Enrollment::create(['student_id' => $student->id, 'level_id' => $level, 'academic_year_id' => $year, 'status' => 'submitted']);
        Storage::disk('local')->put('proof.pdf', '%PDF-1.4 old evidence');
        $doc = EnrollmentDocument::create(['enrollment_id' => $entry->id, 'type' => 'document', 'key' => 'diploma', 'disk' => 'local', 'path' => 'proof.pdf', 'filename' => 'Diplôme.pdf', 'mime' => 'application/pdf', 'size_bytes' => 21, 'sha256' => hash('sha256', 'proof')]);

        return [$admin, $student, $other, $entry, $doc->fresh(), '/dashboard/admin/enrollments/'.$entry->id];
    }

    public function test_start_is_idempotent_and_validation_requires_accepted_evidence(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $this->actingAs($admin)->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'accepted'])->assertSessionHasErrors('review');
        $this->post($url.'/start-analysis')->assertSessionHasNoErrors();
        $this->post($url.'/start-analysis')->assertSessionHasNoErrors();
        $this->assertSame('pending', $entry->fresh()->status->value);
        Mail::assertSent(EnrollmentReviewUpdated::class, fn ($mail) => $mail->kind === 'analysis_started' && $mail->hasTo($student->email));
        Mail::assertSentCount(1);
        $this->assertSame(1, $entry->events()->where('event', 'analysis_started')->count());
        $this->post($url.'/validate')->assertSessionHasErrors('decision');
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'accepted'])->assertSessionHasNoErrors();
        $this->assertSame($admin->id, $doc->fresh()->verified_by);
        $this->post($url.'/validate')->assertSessionHasNoErrors();
        $this->assertSame('validated', $entry->fresh()->status->value);
        $this->assertSame('unpaid', $entry->fresh()->payment_status->value);
        Mail::assertSent(EnrollmentReviewUpdated::class, fn ($mail) => $mail->kind === 'validated');
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'rejected', 'reason' => 'Test refus'])->assertSessionHasErrors('review');
        $this->post($url.'/start-analysis')->assertSessionHasErrors('review');
        Mail::assertSentCount(3);
    }

    public function test_review_actions_return_to_the_dossier_after_an_inline_preview(): void
    {
        [$admin, , , , $doc, $url] = $this->fixture();
        $preview = route('dashboard.admin.enrollments.documents.preview', $doc->uuid);
        $review = $url.'/documents/'.$doc->uuid.'/review';

        $this->actingAs($admin)->get($preview)->assertOk();
        $this->post($url.'/start-analysis')->assertRedirect($url)->assertSessionHasNoErrors();
        $this->get($preview)->assertOk();
        $this->post($review, ['verdict' => 'invalid'])->assertRedirect($url)->assertSessionHasErrors('verdict');
        $this->post($review, ['verdict' => 'accepted'])->assertRedirect($url)->assertSessionHasNoErrors();
        $this->get($preview)->assertOk();
        $this->post($url.'/validate')->assertRedirect($url)->assertSessionHasNoErrors();
    }

    public function test_corrections_require_reason_and_student_can_replace_adverse_evidence(): void
    {
        [$admin, $student, $other, $entry, $doc, $url] = $this->fixture();
        $review = $url.'/documents/'.$doc->uuid.'/review';
        $replace = '/dashboard/enrollments/documents/'.$doc->uuid.'/replace';
        $this->actingAs($admin)->post($url.'/start-analysis')->assertSessionHasNoErrors();
        $this->post($review, ['verdict' => 'correction_requested'])->assertSessionHasErrors('review');
        $this->post($review, ['verdict' => 'correction_requested', 'reason' => 'Merci de transmettre une copie lisible.'])->assertSessionHasNoErrors();
        $this->actingAs($student)->get('/dashboard/enrollments/'.$entry->uuid)->assertInertia(fn ($page) => $page->where('enrollment.documents.0.can_replace', true));
        $this->actingAs($admin)->post($url.'/request-corrections')->assertSessionHasNoErrors();
        $this->post($url.'/request-corrections')->assertSessionHasNoErrors();
        Mail::assertSentCount(3);
        Mail::assertSent(EnrollmentReviewUpdated::class, fn ($mail) => $mail->kind === 'corrections_requested' && str_contains($mail->render(), 'copie lisible'));
        $this->actingAs($other)->post($replace, ['file' => UploadedFile::fake()->create('nouveau.pdf', 10, 'application/pdf')])->assertForbidden();
        $this->actingAs($student)->delete('/dashboard/enrollments/documents/'.$doc->uuid)->assertForbidden();
        $this->post($replace, ['file' => UploadedFile::fake()->create('nouveau.pdf', 10, 'application/pdf')])->assertSessionHasNoErrors();
        $fresh = $doc->fresh();
        $this->assertSame('pending', $fresh->review_status);
        $this->assertSame($doc->version + 1, $fresh->version);
        $this->assertFalse($fresh->verified);
        $this->assertNull($fresh->verified_by);
        Storage::disk('local')->assertExists('proof.pdf');
        Storage::disk('local')->assertExists($fresh->path);
        $this->assertDatabaseHas('enrollment_events', ['enrollment_id' => $entry->id, 'event' => 'document_replaced', 'actor_id' => $student->id]);
        $this->post($replace, ['file' => UploadedFile::fake()->create('encore.pdf', 10, 'application/pdf')])->assertSessionHasErrors('file');
        $this->actingAs($admin)->post($url.'/validate')->assertSessionHasErrors('decision');
    }

    public function test_new_actions_are_admin_only_and_document_binding_is_enforced(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $this->actingAs($student)->post($url.'/start-analysis')->assertForbidden();
        $this->post($url.'/request-corrections')->assertForbidden();
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'accepted'])->assertForbidden();
        $this->actingAs($admin)->post($url.'/start-analysis')->assertSessionHasNoErrors();
        $second = $entry->fresh()->replicate(['uuid']);
        $second->save();
        $this->post('/dashboard/admin/enrollments/'.$second->id.'/documents/'.$doc->uuid.'/review', ['verdict' => 'accepted'])->assertNotFound();
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'invented'])->assertSessionHasErrors('verdict');
        $this->post($url.'/reject', ['reason' => 'Les conditions d’admission ne sont pas remplies.'])->assertSessionHasNoErrors();
        Mail::assertSent(EnrollmentReviewUpdated::class, fn ($mail) => $mail->kind === 'rejected' && str_contains($mail->render(), 'conditions d’admission'));
    }

    public function test_mail_failure_keeps_analysis_committed_and_records_delivery_failure(): void
    {
        [$admin, , , $entry, , $url] = $this->fixture();
        Mail::swap(\Mockery::mock(\Illuminate\Contracts\Mail\Mailer::class, function ($mock) {
            $mock->shouldReceive('to')->once()->andThrow(new \RuntimeException('SMTP indisponible'));
        }));
        $this->actingAs($admin)->post($url.'/start-analysis')->assertSessionHasNoErrors();
        $this->assertSame('pending', $entry->fresh()->status->value);
        $this->assertDatabaseHas('enrollment_events', ['enrollment_id' => $entry->id, 'event' => 'email_failed']);
    }

    public function test_report_waits_for_every_piece_and_contains_verdicts_and_remarks_without_duplicates(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $second = $doc->replicate(['uuid']);
        $second->key = 'birth_certificate';
        $second->filename = 'Acte.pdf';
        $second->save();
        $this->actingAs($admin)->post($url.'/start-analysis')->assertSessionHasNoErrors();
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'accepted', 'reason' => 'Copie conforme.'])->assertSessionHasNoErrors();
        Mail::assertNotSent(EnrollmentReviewUpdated::class, fn ($mail) => $mail->kind === 'analysis_completed');
        $this->assertEmpty($entry->fresh()->meta['analysis_completed_at'] ?? null);
        $this->post($url.'/documents/'.$second->uuid.'/review', ['verdict' => 'correction_requested', 'reason' => 'Merci de transmettre une copie lisible.'])->assertSessionHasNoErrors();
        Mail::assertSent(EnrollmentReviewUpdated::class, function ($mail) use ($student, $entry) {
            if ($mail->kind !== 'analysis_completed') {
                return false;
            }
            $html = $mail->render();

            return $mail->hasTo($student->email) && str_contains($html, $entry->reference)
                && str_contains($html, '2 sur 2') && str_contains($html, 'Diplôme.pdf') && str_contains($html, 'Acte.pdf')
                && str_contains($html, 'Copie conforme.') && str_contains($html, 'copie lisible')
                && str_contains($html, 'Acceptée') && str_contains($html, 'À corriger') && str_contains($html, 'décision finale');
        });
        $this->assertNotEmpty($entry->fresh()->meta['analysis_completed_at']);
        $this->assertSame('pending', $entry->fresh()->status->value);
        $this->assertSame('unpaid', $entry->fresh()->payment_status->value);
        $this->post($url.'/documents/'.$second->uuid.'/review', ['verdict' => 'correction_requested', 'reason' => 'Merci de transmettre une copie lisible.'])->assertSessionHasNoErrors();
        Mail::assertSentCount(2);
        $this->assertSame(1, $entry->events()->where('event', 'analysis_completed')->count());
        $this->actingAs($student)->get('/dashboard/enrollments/'.$entry->uuid)->assertInertia(fn ($page) => $page->where('enrollment.analysis_completed_at', $entry->fresh()->meta['analysis_completed_at']));
    }

    public function test_new_document_version_requires_review_then_generates_an_updated_report(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $review = $url.'/documents/'.$doc->uuid.'/review';
        $this->actingAs($admin)->post($url.'/start-analysis');
        $this->post($review, ['verdict' => 'rejected', 'reason' => 'Photo illisible.'])->assertSessionHasNoErrors();
        $this->assertNotEmpty($entry->fresh()->meta['analysis_completed_at']);
        $this->post($url.'/request-corrections')->assertSessionHasNoErrors();
        $this->actingAs($student)->post('/dashboard/enrollments/documents/'.$doc->uuid.'/replace', ['file' => UploadedFile::fake()->create('corrige.pdf', 10, 'application/pdf')])->assertSessionHasNoErrors();
        $this->assertNull($entry->fresh()->meta['analysis_completed_at']);
        $this->actingAs($admin)->post($review, ['verdict' => 'accepted'])->assertSessionHasNoErrors();
        $reports = Mail::sent(EnrollmentReviewUpdated::class, fn ($mail) => $mail->kind === 'analysis_completed');
        $this->assertCount(2, $reports);
        $html = $reports->last()->render();
        $this->assertStringContainsString('corrige.pdf (v2)', $html);
        $this->assertStringContainsString('Toutes les pièces transmises ont été acceptées', $html);
        $this->assertStringNotContainsString('Photo illisible.', $html);
        $this->assertSame(2, $entry->events()->where('event', 'analysis_completed')->count());
    }

    public function test_rolled_back_review_does_not_send_a_report(): void
    {
        [$admin, , , $entry, $doc, $url] = $this->fixture();
        $this->actingAs($admin)->post($url.'/start-analysis');
        DB::beginTransaction();
        app(\App\Modules\Enrollment\Application\UseCases\ReviewEnrollment::class)->document($entry->id, $doc->uuid, $admin->id, 'accepted', null);
        Mail::assertNotSent(EnrollmentReviewUpdated::class, fn ($mail) => $mail->kind === 'analysis_completed');
        DB::rollBack();
        $this->assertNull($entry->fresh()->meta['analysis_completed_at'] ?? null);
        $this->assertSame('pending', $doc->fresh()->review_status);
        $this->assertSame(0, $entry->events()->where('event', 'analysis_completed')->count());
    }

    public function test_student_can_replace_a_correctable_piece_immediately_without_notification(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $replace = '/dashboard/enrollments/documents/'.$doc->uuid.'/replace';
        $this->actingAs($admin)->post($url.'/start-analysis');
        $this->actingAs($student)->post($replace, ['file' => UploadedFile::fake()->create('preuve.pdf', 10, 'application/pdf')])->assertSessionHasErrors('file');
        foreach (['correction_requested', 'rejected'] as $verdict) {
            $this->actingAs($admin)->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => $verdict, 'reason' => 'Transmettre une copie lisible.'])->assertSessionHasNoErrors();
            $this->actingAs($student)->get('/dashboard/enrollments/'.$entry->uuid)->assertInertia(fn ($page) => $page->where('enrollment.documents.0.can_replace', true));
            $this->post($replace, ['file' => UploadedFile::fake()->create('corrige.pdf', 10, 'application/pdf')])->assertSessionHasNoErrors();
            $this->assertSame('pending', $doc->fresh()->review_status);
            $this->get('/dashboard/enrollments/'.$entry->uuid)->assertInertia(fn ($page) => $page->where('enrollment.documents.0.can_replace', false));
        }
        $this->assertSame(0, $entry->events()->where('event', 'corrections_requested')->count());
        $this->actingAs($admin)->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'accepted']);
        $this->actingAs($student)->post($replace, ['file' => UploadedFile::fake()->create('autre.pdf', 10, 'application/pdf')])->assertSessionHasErrors('file');
        $this->actingAs($admin)->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'rejected', 'reason' => 'Motif test']);
        $this->post($url.'/reject', ['reason' => 'Décision définitive du service.'])->assertSessionHasNoErrors();
        $this->actingAs($student)->post($replace, ['file' => UploadedFile::fake()->create('autre.pdf', 10, 'application/pdf')])->assertSessionHasErrors('file');
    }

    public function test_multipart_replacement_notifies_administration_and_highlights_reexamination(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        config(['mail.admissions_address' => 'admissions@example.test']);
        $this->actingAs($admin)->post($url.'/start-analysis');
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'correction_requested', 'reason' => 'Copie à remplacer.']);
        $studentUrl = '/dashboard/enrollments/'.$entry->uuid;
        $replace = '/dashboard/enrollments/documents/'.$doc->uuid.'/replace';
        $this->actingAs($student)->from($studentUrl)->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Error-Bag' => 'replacement-'.$doc->uuid])
            ->post($replace, ['file' => UploadedFile::fake()->create('corrige.pdf', 10, 'application/pdf')])->assertRedirect($studentUrl)->assertSessionHasNoErrors()->assertSessionHas('success');
        Mail::assertSent(\App\Mail\EnrollmentDocumentReplaced::class, function ($mail) use ($entry, $student) {
            return $mail->hasTo('admissions@example.test') && ! $mail->hasTo($student->email)
                && $mail->document['version'] === 2 && str_contains($mail->render(), $entry->reference)
                && str_contains($mail->render(), '/dashboard/admin/enrollments/'.$entry->id)
                && str_contains($mail->render(), 'corrige.pdf') && count($mail->attachments) === 0;
        });
        $this->flushHeaders();
        $this->actingAs($admin)->get('/dashboard/admin/enrollments?reexamination=1')->assertInertia(fn ($page) => $page
            ->where('enrollments.total', 1)->where('reexamination_total', 1)->where('enrollments.data.0.reexamination_count', 1));
        $this->get($url)->assertInertia(fn ($page) => $page->where('enrollment.documents.0.needs_reexamination', true)->where('enrollment.documents.0.version', 2));
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'accepted'])->assertSessionHasNoErrors();
        $this->get('/dashboard/admin/enrollments?reexamination=1')->assertInertia(fn ($page) => $page->where('enrollments.total', 0)->where('reexamination_total', 0));
        $this->get($url)->assertInertia(fn ($page) => $page->where('enrollment.documents.0.needs_reexamination', false));
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'pending'])->assertSessionHasNoErrors();
        $this->post($url.'/reject', ['reason' => 'Décision définitive.'])->assertSessionHasNoErrors();
        $this->get($url)->assertInertia(fn ($page) => $page->where('enrollment.documents.0.needs_reexamination', false));
        $this->get('/dashboard/admin/enrollments')->assertInertia(fn ($page) => $page->where('enrollments.data.0.reexamination_count', 0));
        $this->assertSame(1, Mail::sent(\App\Mail\EnrollmentDocumentReplaced::class)->count());
    }

    public function test_notification_failure_keeps_the_replacement_file_and_version(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $this->actingAs($admin)->post($url.'/start-analysis');
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'rejected', 'reason' => 'Copie à refaire.']);
        Mail::swap(\Mockery::mock(\Illuminate\Contracts\Mail\Mailer::class, function ($mock) {
            $mock->shouldReceive('to')->once()->andThrow(new \RuntimeException('SMTP indisponible'));
        }));
        $this->actingAs($student)->post('/dashboard/enrollments/documents/'.$doc->uuid.'/replace', ['file' => UploadedFile::fake()->create('corrige.pdf', 10, 'application/pdf')])->assertSessionHasNoErrors();
        $this->assertSame(2, $doc->fresh()->version);
        Storage::disk('local')->assertExists($doc->fresh()->path);
        Storage::disk('local')->assertExists('proof.pdf');
        $this->assertTrue($entry->events()->where('event', 'email_failed')->where('payload->notification', 'document_replaced_admin')->exists());
    }

    public function test_invalid_replacement_can_be_retried_and_does_not_notify_before_success(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $this->actingAs($admin)->post($url.'/start-analysis');
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'correction_requested', 'reason' => 'Copie à refaire.']);
        $replace = '/dashboard/enrollments/documents/'.$doc->uuid.'/replace';
        $this->actingAs($student)->post($replace)->assertSessionHasErrors('file');
        $this->post($replace, ['file' => UploadedFile::fake()->create('bad.txt', 1, 'text/plain')])->assertSessionHasErrors('file');
        Mail::assertNotSent(\App\Mail\EnrollmentDocumentReplaced::class);
        $this->assertSame(1, $doc->fresh()->version);
        $this->post($replace, ['file' => UploadedFile::fake()->create('bon.pdf', 10, 'application/pdf')])->assertSessionHasNoErrors();
        Mail::assertSent(\App\Mail\EnrollmentDocumentReplaced::class, 1);
        $this->assertSame(2, $doc->fresh()->version);
    }

    public function test_dashboard_notifications_are_per_admin_and_open_the_exact_document(): void
    {
        [$admin, $student, $other, $entry, $doc, $url] = $this->fixture();
        $other->assignRole('admin');
        $this->actingAs($admin)->post($url.'/start-analysis');
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'correction_requested', 'reason' => 'Copie à remplacer.']);
        $this->actingAs($student)->post('/dashboard/enrollments/documents/'.$doc->uuid.'/replace', ['file' => UploadedFile::fake()->create('nouvelle.pdf', 10, 'application/pdf')])->assertSessionHasNoErrors();
        $notice = $admin->notifications()->firstOrFail();
        $otherNotice = $other->notifications()->firstOrFail();
        $this->assertNotSame($notice->id, $otherNotice->id);
        $this->assertSame($doc->uuid, $notice->data['document_uuid']);
        $this->assertSame(2, $notice->data['version']);
        $this->assertSame(0, $student->notifications()->where('type', \App\Notifications\EnrollmentDocumentReplacement::class)->count());
        $this->actingAs($admin)->get($url)->assertInertia(fn ($page) => $page->where('adminNotifications.unread_count', 1)->where('adminNotifications.items.0.reference', $entry->reference)->where('adminNotifications.items.0.filename', 'nouvelle.pdf'));
        $target = $url.'?'.http_build_query(['document' => $doc->uuid]).'#review-document-'.$doc->uuid;
        $this->post('/dashboard/admin/notifications/'.$notice->id.'/open')->assertStatus(303)->assertRedirect($target);
        $this->assertNotNull($notice->fresh()->read_at);
        $this->assertNull($otherNotice->fresh()->read_at);
        $this->get($url.'?'.http_build_query(['document' => $doc->uuid]))->assertInertia(fn ($page) => $page->where('enrollment.selected_document_uuid', $doc->uuid)->where('adminNotifications.unread_count', 0));
        $this->post('/dashboard/admin/notifications/'.$otherNotice->id.'/open')->assertNotFound();
        $this->actingAs($student)->post('/dashboard/admin/notifications/'.$notice->id.'/open')->assertForbidden();
        $this->post('/dashboard/admin/notifications/read-all')->assertForbidden();
        $this->get('/dashboard/enrollments/'.$entry->uuid)->assertInertia(fn ($page) => $page->where('adminNotifications', null));
        $this->actingAs($other)->post('/dashboard/admin/notifications/read-all')->assertRedirect();
        $this->assertNotNull($otherNotice->fresh()->read_at);
        $this->actingAs($admin)->get($url.'?document=not-a-document')->assertNotFound();
    }

    public function test_invalid_upload_and_rolled_back_replacement_do_not_create_dashboard_notifications(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $this->actingAs($admin)->post($url.'/start-analysis');
        $this->post($url.'/documents/'.$doc->uuid.'/review', ['verdict' => 'rejected', 'reason' => 'Copie à refaire.']);
        $this->actingAs($student)->post('/dashboard/enrollments/documents/'.$doc->uuid.'/replace')->assertSessionHasErrors('file');
        $this->assertSame(0, $admin->notifications()->count());
        DB::beginTransaction();
        app(\App\Modules\Enrollment\Application\UseCases\ReplaceReviewedDocument::class)->execute($doc->uuid, $student->id, UploadedFile::fake()->create('nouvelle.pdf', 10, 'application/pdf'));
        $this->assertSame(1, $admin->notifications()->count());
        DB::rollBack();
        $this->assertSame(0, $admin->notifications()->count());
    }

    public function test_student_receives_each_verdict_without_duplicates_and_opens_only_owned_documents(): void
    {
        [$admin, $student, $other, $entry, $doc, $url] = $this->fixture();
        $this->actingAs($admin)->post($url.'/start-analysis');
        $review = $url.'/documents/'.$doc->uuid.'/review';
        foreach (['accepted', 'rejected', 'correction_requested'] as $verdict) {
            $this->post($review, ['verdict' => $verdict, 'reason' => 'Remarque pour '.$verdict])->assertSessionHasNoErrors();
            $this->assertTrue($student->notifications()->get()->contains(fn ($notice) => ($notice->data['verdict'] ?? null) === $verdict));
        }
        $this->post($review, ['verdict' => 'correction_requested', 'reason' => 'Remarque pour correction_requested']);
        $this->assertSame(3, $student->notifications()->count());
        $this->post($review, ['verdict' => 'pending']);
        $this->assertSame(3, $student->notifications()->count());
        $notice = $student->notifications()->get()->first(fn ($notice) => ($notice->data['verdict'] ?? null) === 'correction_requested')
            ?? throw new \RuntimeException('Notification de correction absente.');;
        $this->actingAs($student)->get('/dashboard/enrollments')->assertInertia(fn ($page) => $page
            ->where('studentNotifications.unread_count', 3)->has('studentNotifications.items', 3)
            ->where('studentNotifications.items', fn ($items) => collect($items)->contains(fn ($item) => $item['comment'] === 'Remarque pour correction_requested'))
            ->where('adminNotifications', null));
        $target = '/dashboard/enrollments/'.$entry->uuid.'?'.http_build_query(['document' => $doc->uuid]).'#student-document-'.$doc->uuid;
        $this->post('/dashboard/notifications/'.$notice->id.'/open')->assertStatus(303)->assertRedirect($target);
        $this->assertNotNull($notice->fresh()->read_at);
        $this->get('/dashboard/enrollments/'.$entry->uuid.'?'.http_build_query(['document' => $doc->uuid]))->assertInertia(fn ($page) => $page->where('enrollment.selected_document_uuid', $doc->uuid)->where('studentNotifications.unread_count', 2));
        $this->actingAs($other)->get('/dashboard/enrollments')->assertInertia(fn ($page) => $page->where('studentNotifications.unread_count', 0)->has('studentNotifications.items', 0));
        $this->post('/dashboard/notifications/'.$notice->id.'/open')->assertNotFound();
        $this->post('/dashboard/notifications/read-all')->assertRedirect();
        $this->assertSame(2, $student->unreadNotifications()->count());
        $this->actingAs($student)->post('/dashboard/notifications/read-all')->assertRedirect();
        $this->assertSame(0, $student->unreadNotifications()->count());
        $this->get('/dashboard/enrollments/'.$entry->uuid.'?document=another-document')->assertNotFound();
    }

    public function test_student_notification_is_rolled_back_with_the_review(): void
    {
        [$admin, $student, , $entry, $doc, $url] = $this->fixture();
        $this->actingAs($admin)->post($url.'/start-analysis');
        DB::beginTransaction();
        app(\App\Modules\Enrollment\Application\UseCases\ReviewEnrollment::class)->document($entry->id, $doc->uuid, $admin->id, 'accepted', null);
        $this->assertSame(1, $student->notifications()->count());
        DB::rollBack();
        $this->assertSame(0, $student->notifications()->count());
        $this->assertSame('pending', $doc->fresh()->review_status);
    }
}
