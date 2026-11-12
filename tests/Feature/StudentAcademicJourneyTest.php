<?php

namespace Tests\Feature;

use App\Mail\EnrollmentReviewUpdated;
use App\Models\AcademicYear;
use App\Models\AdmissionCondition;
use App\Models\Courses;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetail;
use App\Models\Professor;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\AccessRule;
use App\Models\Student\CourseException;
use App\Models\Student\StudentPayment;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\Enrollment\Application\UseCases\RecordEnrollmentDecision;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Services\MatriculeGenerator;
use App\Modules\Enrollment\Domain\ValueObjects\Matricule;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Application\Services\AcademicRuleService;
use App\Modules\Student\Application\Services\ProviderPaymentReconciliation;
use App\Modules\Student\Application\Services\StudentAdmissionService;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Modules\Student\Application\Services\StudentMatriculeMigration;
use App\Modules\Student\Domain\Payments\PaymentProviderVerifier;
use App\Modules\Student\Domain\Payments\VerifiedPayment;
use App\Notifications\StudentAdmissionActivated;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentAcademicJourneyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh', ['--force' => true]);
        RefreshDatabaseState::$migrated = false;
        Mail::fake();
        Storage::fake('local');
    }

    private function user(string $email, string $role = 'user'): User
    {
        $u = new User;
        $u->forceFill(['first_name' => 'Test', 'last_name' => 'Étudiant', 'email' => $email, 'password' => 'password', 'email_verified_at' => now()])->save();
        $u->assignRole(Role::findOrCreate($role, 'web'));

        return $u;
    }

    private function application(bool $accept = true): array
    {
        $admin = $this->user('admin@example.test', 'admin');
        $student = $this->user('student@example.test');
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = Level::create(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1', 'is_active' => true]);
        LevelDetail::create(['level_id' => $level->id, 'price' => '100.00', 'price_foreign' => '160.00', 'price_national_first' => '50.00', 'price_national_second' => '50.00', 'price_foreign_first' => '80.00', 'price_foreign_second' => '80.00']);
        $year = DB::table('academic_years')->insertGetId(['title' => '2026–2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $application = Enrollment::create(['student_id' => $student->id, 'level_id' => $level->id, 'academic_year_id' => $year, 'matricule' => 'ST-2026-0001', 'status' => 'submitted']);
        $doc = EnrollmentDocument::create(['enrollment_id' => $application->id, 'type' => 'document', 'key' => 'diplome', 'disk' => 'local', 'path' => 'private/diplome.pdf', 'filename' => 'Diplôme.pdf', 'mime' => 'application/pdf', 'size_bytes' => 100, 'sha256' => hash('sha256', 'test'), 'review_status' => $accept ? 'accepted' : 'pending', 'verified' => $accept]);

        return [$admin, $student, $application, $doc];
    }

    private function admitted(bool $assess = false): array
    {
        [$admin,$student,$application] = $this->application();
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasNoErrors();
        $academic = AcademicEnrollment::where('application_id', $application->id)->firstOrFail();
        $academic->update(['enrollment_status' => 'confirmed']);
        $course = new Courses;
        $course->forceFill(['level_id' => $academic->level_id, 'title' => 'Introduction au droit', 'code' => 'DR101', 'credits' => 3])->save();
        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $academic->level_id, 'academic_year_id' => $academic->academic_year_id, 'is_published' => true]);
        $assignment = AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'assignment', 'title' => 'Travail 1', 'body' => 'Expliquez les notions du cours.', 'is_published' => true]);
        Storage::disk('local')->put('academic-resources/support.pdf', '%PDF-1.4 support');
        $material = AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'material', 'title' => 'Support privé', 'body' => 'Contenu protégé', 'path' => 'academic-resources/support.pdf', 'filename' => 'support.pdf', 'mime' => 'application/pdf', 'is_published' => true]);
        if ($assess) {
            app(StudentFinanceService::class)->assess($academic, $admin, 'national');
        }

        return [$admin, $student->fresh(), $application, $academic, $offering, $assignment, $material];
    }

    private function rule(User $admin, string $feature = 'assignments_submit', string $mode = 'minimum', array $extra = []): AccessRule
    {
        return app(AcademicRuleService::class)->save($admin, array_merge(['feature' => $feature, 'mode' => $mode, 'minimum' => '50.00', 'allow_exemption' => true, 'reason' => 'Règle approuvée par l’administration.'], $extra));
    }

    private function payment(AcademicEnrollment $academic, User $admin, string $amount, string $status = 'confirmed'): StudentPayment
    {
        $service = app(StudentFinanceService::class);
        $p = $service->record($academic, $admin, ['amount' => $amount, 'method' => 'bank_transfer', 'reference' => 'BANK-'.(StudentPayment::count() + 1), 'note' => 'Rapprochement bancaire documenté.']);
        if ($status === 'confirmed') {
            $service->transition($p, $admin, 'confirmed', 'Rapprochement bancaire vérifié.');
        }

        return $p->fresh();
    }

    public function test_validation_creates_profile_role_and_unique_academic_enrollment_without_changing_payment_or_matricule(): void
    {
        [$admin,$student,$application] = $this->application();
        $student->assignRole(Role::findOrCreate('instructor', 'web'));
        $before = User::count();
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasNoErrors();
        $profile = $student->fresh()->studentProfile;
        $academic = AcademicEnrollment::firstOrFail();
        $this->assertSame('active', $profile->student_status);
        $this->assertSame('ST-2026-0001', $profile->matricule);
        $this->assertSame($application->matricule, $academic->matricule);
        $this->assertTrue($student->fresh()->hasAllRoles(['student', 'instructor', 'user']));
        $this->assertSame($before, User::count());
        $this->assertSame('pending_confirmation', $academic->enrollment_status);
        $this->assertNull($academic->fee_category);
        $this->assertSame('unpaid', $application->fresh()->payment_status->value);
        $this->assertSame($application->level_id, $academic->level_id);
        $this->assertSame($application->academic_year_id, $academic->academic_year_id);
        app(StudentAdmissionService::class)->activate($application->fresh(), $admin->id);
        $this->assertDatabaseCount('student_profiles', 1);
        $this->assertDatabaseCount('academic_enrollments', 1);
        $this->assertSame(1, $student->notifications()->where('type', StudentAdmissionActivated::class)->count());
        $this->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasErrors('decision');
        $this->assertDatabaseCount('academic_enrollments', 1);
        Mail::assertSent(EnrollmentReviewUpdated::class, fn ($m) => $m->kind === 'validated' && str_contains($m->render(), '/dashboard/student?application='));
    }

    public function test_incomplete_or_unaccepted_documents_cannot_activate_student_access(): void
    {
        [$admin,$student,$application] = $this->application(false);
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasErrors('decision');
        $this->assertDatabaseCount('academic_enrollments', 0);
        $this->assertFalse($student->fresh()->hasRole('student'));
        $application->documents()->update(['review_status' => 'accepted']);
        AdmissionCondition::create(['level_id' => $application->level_id, 'faculty_id' => $application->level->faculty_id, 'title' => 'Acte de naissance', 'section' => 'personal_info', 'is_required' => true]);
        $this->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasErrors('decision');
        $this->assertDatabaseCount('student_profiles', 0);
    }

    public function test_admission_notifications_wait_for_commit(): void
    {
        [$admin,$student,$application] = $this->application();
        DB::beginTransaction();
        app(RecordEnrollmentDecision::class)->execute($application->id, $admin->id, EnrollmentStatus::VALIDATED);
        $this->assertSame(0, $student->notifications()->where('type', StudentAdmissionActivated::class)->count());
        Mail::assertNothingSent();
        DB::rollBack();
        $this->assertDatabaseCount('academic_enrollments', 0);
        $this->assertSame(0, $student->notifications()->count());
        Mail::assertNothingSent();
    }

    public function test_unpaid_student_can_open_dashboard_and_published_courses(): void
    {
        [, $student,, $academic] = $this->admitted(true);
        $this->actingAs($student)->get('/dashboard')->assertRedirect('/dashboard/student');
        $this->get('/dashboard/student')->assertOk()->assertInertia(fn (Assert $p) => $p->component('dashboard/student/Portal')->where('academic.matricule', 'ST-2026-0001')->where('academic.faculty', 'Droit')->where('academic.level', 'Licence 1')->where('academic.year', '2026–2027')->where('balance.financial_clearance_status', 'unpaid')->where('permissions.courses_view.allowed', true)->where('permissions.results_view.allowed', true)->has('courses', 1));
        $this->get('/dashboard/student/courses')->assertOk();
        $this->get('/dashboard/student/fees')->assertOk();
        $this->get('/dashboard/student/requests')->assertOk();
        $notice = $student->notifications()->where('type', StudentAdmissionActivated::class)->firstOrFail();
        $this->post('/dashboard/notifications/'.$notice->id.'/open')->assertRedirect('/dashboard/student?academic='.$academic->id);
    }

    public function test_role_alone_does_not_grant_an_academic_context(): void
    {
        $user = $this->user('role-only@example.test', 'student');
        $this->actingAs($user)->get('/dashboard/student')->assertForbidden();
    }

    public function test_unpaid_student_cannot_submit_or_download_restricted_resource_by_direct_route(): void
    {
        [$admin,$student,,$academic,,$assignment,$material] = $this->admitted(true);
        $this->rule($admin);
        $this->rule($admin, 'materials_download');
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['body' => 'Tentative directe'])->assertForbidden();
        $this->get('/dashboard/student/resources/'.$material->id.'/download')->assertForbidden();
        $this->assertDatabaseCount('academic_submissions', 0);
        $this->get('/dashboard/student/materials')->assertInertia(fn (Assert $p) => $p->where('resources.0.body', null)->where('resources.0.download_url', null));
    }

    public function test_confirmed_threshold_unlocks_only_the_required_services_without_claiming_full_payment(): void
    {
        [$admin,$student,,$academic,,$assignment,$material] = $this->admitted(true);
        $this->rule($admin);
        $this->rule($admin, 'materials_download');
        $this->payment($academic, $admin, '50.00');
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['body' => 'Mon travail enregistré.'])->assertSessionHasNoErrors();
        $this->get('/dashboard/student/resources/'.$material->id.'/download')->assertOk()->assertDownload('support.pdf');
        $this->get('/dashboard/student')->assertInertia(fn (Assert $p) => $p->where('permissions.assignments_submit.allowed', true)->where('balance.balance_cents', 5000)->where('balance.financial_clearance_status', 'partial'));
    }

    public function test_insufficient_partial_payment_does_not_unlock_service(): void
    {
        [$admin,$student,,$academic,,$assignment] = $this->admitted(true);
        $this->rule($admin);
        $this->payment($academic, $admin, '20.00');
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['body' => 'Travail'])->assertForbidden();
    }

    public function test_pending_payment_does_not_unlock_or_produce_a_receipt(): void
    {
        [$admin,$student,,$academic,,$assignment] = $this->admitted(true);
        $this->rule($admin);
        $payment = $this->payment($academic, $admin, '100.00', 'pending');
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['body' => 'Travail'])->assertForbidden();
        $this->get('/dashboard/student/payments/'.$payment->uuid.'/receipt')->assertNotFound();
        $this->get('/dashboard/student/fees')->assertInertia(fn (Assert $p) => $p->where('balance.pending_cents', 10000)->where('balance.paid_cents', 0));
    }

    public function test_valid_exemption_and_scholarship_are_taken_into_account(): void
    {
        [$admin,$student,,$academic,,$assignment] = $this->admitted(true);
        $this->rule($admin);
        $grant = app(StudentFinanceService::class)->adjust($academic, $admin, ['type' => 'exemption', 'reason' => 'Exonération approuvée et documentée.', 'expires_at' => today()->addYear()->toDateString()]);
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['body' => 'Travail exonéré.'])->assertSessionHasNoErrors();
        $this->get('/dashboard/student/fees')->assertInertia(fn (Assert $p) => $p->where('balance.financial_clearance_status', 'exempted')->where('balance.waived_cents', 10000));
        $this->travelTo(today()->addYears(2)); // Expiration réelle ; la décision approuvée reste immuable.
        $this->assertFalse(app(AcademicAccessService::class)->decision($academic->fresh(), 'assignments_submit')['allowed']);
    }

    public function test_refund_or_cancellation_recalculates_access(): void
    {
        [$admin,$student,,$academic,,$assignment] = $this->admitted(true);
        $this->rule($admin);
        $payment = $this->payment($academic, $admin, '50.00');
        $this->assertTrue(app(AcademicAccessService::class)->decision($academic, 'assignments_submit')['allowed']);
        $refunds = app(\App\Modules\Student\Application\Services\PaymentRefundService::class);
        $refund = $refunds->request($payment, $admin, ['amount' => '50.00', 'operation_key' => (string)\Illuminate\Support\Str::uuid(), 'reason' => 'Demande de remboursement documentée.']);
        $refunds->transition($refund, $admin, ['status' => 'approved', 'reason' => 'Autorisation de remboursement documentée.']);
        $refunds->transition($refund, $admin, ['status' => 'executed', 'method' => 'bank_transfer', 'execution_reference' => 'REFUND-TEST-001', 'reason' => 'Décaissement contrôlé et documenté.']);
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['body' => 'Travail'])->assertForbidden();
        $payment = $this->payment($academic, $admin, '50.00');
        app(StudentFinanceService::class)->transition($payment, $admin, 'cancelled', 'Écriture incorrecte annulée après contrôle.');
        $this->assertFalse(app(AcademicAccessService::class)->decision($academic->fresh(), 'assignments_submit')['allowed']);
    }

    public function test_plan_respects_due_dates_and_overrides_do_not_bypass_suspension(): void
    {
        [$admin,$student,,$academic] = $this->admitted(true);
        $this->rule($admin, extra: ['allow_plan' => true]);
        app(StudentFinanceService::class)->adjust($academic, $admin, ['type' => 'plan', 'reason' => 'Échéancier approuvé après examen.', 'schedule' => [['due_at' => today()->addMonth()->toDateString(), 'amount' => '50.00'], ['due_at' => today()->addMonths(2)->toDateString(), 'amount' => '50.00']]]);
        $this->assertTrue(app(AcademicAccessService::class)->decision($academic->fresh(), 'assignments_submit')['allowed']);
        $this->travel(40)->days();
        $this->assertFalse(app(AcademicAccessService::class)->decision($academic->fresh(), 'assignments_submit')['allowed']);
        $this->travelBack();
        $academic->profile->update(['student_status' => 'suspended']);
        app(StudentFinanceService::class)->adjust($academic, $admin, ['type' => 'override', 'feature' => 'assignments_submit', 'reason' => 'Dérogation temporaire documentée.', 'expires_at' => today()->addMonth()->toDateString()]);
        $this->assertFalse(app(AcademicAccessService::class)->decision($academic->fresh(), 'assignments_submit')['allowed']);
        $this->actingAs($student)->get('/dashboard/student/fees')->assertOk();
    }

    public function test_student_cannot_see_another_context_or_other_personal_results(): void
    {
        [$admin,$student,$application,$academic,$offering] = $this->admitted(true);
        $other = $this->user('other@example.test');
        $source = Enrollment::create(['student_id' => $other->id, 'level_id' => $academic->level_id, 'academic_year_id' => $academic->academic_year_id, 'matricule' => 'ST-OTHER', 'status' => 'validated']);
        $otherAcademic = app(StudentAdmissionService::class)->activate($source, $admin->id, false);
        $result = AcademicResource::create(['academic_offering_id' => $offering->id, 'student_profile_id' => $otherAcademic->student_profile_id, 'kind' => 'result', 'title' => 'Résultat confidentiel', 'body' => 'Note privée 15/20', 'is_published' => true, 'path' => 'private/result.pdf', 'filename' => 'result.pdf']);
        $this->actingAs($student)->get('/dashboard/student?academic='.$otherAcademic->id)->assertNotFound();
        $this->get('/dashboard/student?application='.$source->uuid)->assertNotFound();
        $this->get('/dashboard/student/resources/'.$result->id.'/download')->assertNotFound();
        $this->get('/dashboard/student/results')->assertInertia(fn (Assert $p) => $p->where('resources', fn ($r) => ! collect($r)->contains('id', $result->id)));
    }

    public function test_student_sees_level_catalog_before_yearly_teaching_is_configured(): void
    {
        [, $student, , $academic] = $this->admitted();
        $catalog = (new Courses)->forceFill(['level_id' => $academic->level_id, 'title' => 'Droit constitutionnel', 'credits' => 6, 'semester' => 1]);
        $catalog->save();
        $this->actingAs($student)->get('/dashboard/student/courses')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('courses', 2)->where('courses', fn ($courses) => collect($courses)->contains(fn ($c) => $c['title'] === 'Droit constitutionnel' && $c['semester'] === '1er semestre' && $c['catalog_only'])));
        $this->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page->where('overview.course_count', 2));
        $configured = AcademicOffering::create(['course_id' => $catalog->id, 'level_id' => $academic->level_id, 'academic_year_id' => $academic->academic_year_id, 'is_published' => false]);
        $this->get('/dashboard/student/courses')->assertInertia(fn (Assert $page) => $page->has('courses', 1));
        $teacher = Professor::create(['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => 'professor@example.test', 'is_active' => true]);
        $configured->update(['is_published' => true, 'professor_id' => $teacher->id]);
        $this->get('/dashboard/student/courses')->assertInertia(fn (Assert $page) => $page
            ->has('courses', 2)->where('courses', fn ($courses) => collect($courses)->contains(fn ($c) => $c['title'] === 'Droit constitutionnel' && $c['semester'] === '1er semestre' && ! $c['catalog_only'] && $c['teacher'] === 'Anne Mbemba')));
    }

    public function test_publication_and_optional_course_affectations_are_enforced(): void
    {
        [$admin,$student,,$academic,$offering] = $this->admitted();
        $offering->update(['is_published' => false]);
        $this->actingAs($student)->get('/dashboard/student/courses')->assertInertia(fn (Assert $p) => $p->has('courses', 0)->has('resources', 0));
        $offering->update(['is_published' => true, 'is_optional' => true]);
        $this->get('/dashboard/student/courses')->assertInertia(fn (Assert $p) => $p->has('courses', 0));
        CourseException::create(['academic_enrollment_id' => $academic->id, 'academic_offering_id' => $offering->id, 'action' => 'include', 'reason' => 'Option académique confirmée.', 'authorized_by' => $admin->id]);
        $this->get('/dashboard/student/courses')->assertInertia(fn (Assert $p) => $p->has('courses', 1));
        $session = AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHour(), 'room' => 'Salle 1', 'is_published' => false]);
        $this->get('/dashboard/student/schedule')->assertInertia(fn (Assert $p) => $p->has('sessions', 0));
        $session->update(['is_published' => true]);
        $this->get('/dashboard/student/schedule?week='.$session->starts_at->copy()->timezone('Africa/Kinshasa')->toDateString())->assertInertia(fn (Assert $p) => $p->has('sessions', 1));
    }

    public function test_results_remain_open_without_payment_and_restrictions_require_regulatory_confirmation(): void
    {
        [$admin,$student,,$academic,$offering] = $this->admitted(true);
        $result = AcademicResource::create(['academic_offering_id' => $offering->id, 'student_profile_id' => $academic->student_profile_id, 'kind' => 'result', 'title' => 'Résultat publié', 'body' => 'Résultat validé par le jury : 15/20', 'is_published' => true]);
        $this->actingAs($student)->get('/dashboard/student/results')->assertOk()->assertInertia(fn (Assert $p) => $p->where('resources', fn ($r) => collect($r)->contains(fn ($x) => $x['id'] === $result->id && str_contains($x['body'], '15/20'))));
        $this->actingAs($admin)->post('/dashboard/admin/student-academic/rules', ['fee_kind' => 'tuition', 'feature' => 'results_view', 'mode' => 'full', 'reason' => 'Restriction demandée sans règlement.'])->assertSessionHasErrors('regulation_reference');
        $this->assertDatabaseCount('academic_access_rules', 0);
    }

    public function test_unauthorized_staff_and_students_cannot_change_financial_rules_or_confirm_payments(): void
    {
        [$admin,$student,,$academic] = $this->admitted(true);
        $payment = $this->payment($academic, $admin, '50.00', 'pending');
        $this->actingAs($student)->post('/dashboard/admin/student-academic/payments/'.$payment->id.'/status', ['status' => 'confirmed', 'reason' => 'Tentative de confirmation cliente.'])->assertForbidden();
        $staff = $this->user('teacher@example.test', 'instructor');
        $this->actingAs($staff)->post('/dashboard/admin/student-academic/rules', ['feature' => 'assignments_submit', 'mode' => 'open', 'reason' => 'Tentative non autorisée.'])->assertForbidden();
        $admin->revokePermissionTo('manage academic finance');
        $role = Role::findByName('admin', 'web');
        $role->revokePermissionTo('manage academic finance');
        $this->actingAs($admin->fresh())->post('/dashboard/admin/student-academic/payments/'.$payment->id.'/status', ['status' => 'confirmed', 'reason' => 'Sans autorisation financière.'])->assertForbidden();
        $this->assertSame('pending', $payment->fresh()->status);
    }

    public function test_unpaid_student_can_contact_administration_and_appeal(): void
    {
        [, $student] = $this->admitted(true);
        $this->actingAs($student)->post('/dashboard/student/requests', ['category' => 'appeal', 'subject' => 'Demande de recours', 'body' => 'Je souhaite obtenir une précision sur mon dossier.'])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('student_service_requests', 1);
    }

    public function test_historical_activation_command_is_idempotent_and_dry_run_does_not_write(): void
    {
        [$admin,$student,$application] = $this->application();
        $application->update(['status' => 'validated']);
        $this->artisan('student:activate-validated', ['--dry-run' => true])->assertExitCode(0);
        $this->assertDatabaseCount('academic_enrollments', 0);
        $this->artisan('student:activate-validated')->assertExitCode(0);
        $this->artisan('student:activate-validated')->assertExitCode(0);
        $this->assertDatabaseCount('academic_enrollments', 1);
        Mail::assertNothingSent();
    }

    public function test_scholarship_and_independent_fee_types_do_not_mix_payment_permissions(): void
    {
        [$admin,$student,,$academic,,$assignment] = $this->admitted(true);
        $this->rule($admin, mode: 'full');
        $finance = app(StudentFinanceService::class);
        $finance->addObligation($academic, $admin, ['kind' => 'registration', 'title' => 'Frais d’inscription autorisés', 'installment' => 1, 'amount' => '20.00', 'reason' => 'Barème complémentaire approuvé.']);
        $p = $finance->record($academic, $admin, ['kind' => 'registration', 'amount' => '20.00', 'method' => 'cash', 'reference' => 'CASH-REG', 'note' => 'Pièce de caisse vérifiée.']);
        $finance->transition($p, $admin, 'confirmed', 'Référence de caisse rapprochée.');
        $this->assertFalse(app(AcademicAccessService::class)->decision($academic, 'assignments_submit')['allowed']);
        $balance = $finance->balance($academic);
        $this->assertSame(12000, $balance['total_cents']);
        $this->assertSame(2000, $balance['paid_cents']);
        $this->assertSame(10000, $balance['balance_cents']);
        $grant = $finance->adjust($academic, $admin, ['type' => 'scholarship', 'amount' => '50.00', 'reason' => 'Bourse partielle accordée par décision.']);
        $this->payment($academic, $admin, '50.00');
        $this->assertTrue(app(AcademicAccessService::class)->decision($academic, 'assignments_submit')['allowed']);
        $this->assertSame(0, $finance->balance($academic)['balance_cents']);
        $grant->update(['is_active' => false]);
        $this->assertFalse(app(AcademicAccessService::class)->decision($academic->fresh(), 'assignments_submit')['allowed']);
    }

    public function test_administrative_forms_can_establish_fees_rules_and_payment_confirmation(): void
    {
        [$admin, $student, $application] = $this->application();
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasNoErrors();
        $academic = $application->academicEnrollment()->firstOrFail();
        $base = '/dashboard/admin/student-academic';
        $pending = $base.'?tab=students&enrollment_status=pending_confirmation';
        $this->get($pending)->assertInertia(fn (Assert $p) => $p->has('students.data', 1)->where('students.data.0.id', $academic->id));
        $this->post($base.'/'.$academic->id.'/status', [
            'student_status' => 'active', 'enrollment_status' => 'confirmed', 'reason' => 'Tentative de confirmation avant couverture.',
        ])->assertSessionHasErrors('enrollment_status');
        $this->actingAs($admin)->get($base.'?academic='.$academic->id)->assertOk()->assertInertia(fn (Assert $p) => $p->component('dashboard/studentAcademic/Index')->where('selected.id', $academic->id));
        $dossier = route('dashboard.admin.student-academic.show', ['academic' => $academic->id, 'view' => 'grid']);
        $this->get($dossier)->assertInertia(fn (Assert $p) => $p->component('dashboard/studentAcademic/Show')
            ->where('academicId', $academic->id)->where('student.email', $student->email)
            ->where('enrollments.0.id', $academic->id)->where('directoryFilters.view', 'grid'));
        $this->actingAs($student)->get($dossier)->assertForbidden();
        $this->actingAs($admin);
        $this->post($base.'/'.$academic->id.'/fees', ['category' => 'national', 'first_due' => today()->addMonth()->toDateString(), 'second_due' => today()->addMonths(2)->toDateString(), 'reason' => 'Nationalité contrôlée avec le dossier.'])->assertSessionHasNoErrors();
        $this->post($base.'/rules', ['fee_kind' => 'tuition', 'feature' => 'assignments_submit', 'mode' => 'minimum', 'minimum' => '50.00', 'reason' => 'Règle financière approuvée pour les dépôts.'])->assertSessionHasNoErrors();
        $this->payment($academic, $admin, '20.00');
        $this->post($base.'/'.$academic->id.'/payments', ['kind' => 'tuition', 'amount' => '30.00', 'method' => 'bank_transfer', 'reference' => 'BANK-HTTP', 'note' => 'Virement à rapprocher au relevé.'])->assertSessionHasNoErrors();
        $payment = StudentPayment::where('reference', 'BANK-HTTP')->firstOrFail();
        $this->assertSame('pending', $payment->status);
        $this->assertSame('pending_confirmation', $academic->fresh()->enrollment_status);
        $this->post($base.'/payments/'.$payment->id.'/status', ['status' => 'confirmed', 'reason' => 'Virement rapproché avec le relevé bancaire.'])->assertSessionHasNoErrors();
        $this->assertSame('confirmed', $academic->fresh()->enrollment_status);
        $this->get($pending)->assertInertia(fn (Assert $p) => $p->has('students.data', 0));
        $this->get($base.'?tab=students&enrollment_status=confirmed')->assertInertia(fn (Assert $p) => $p->has('students.data', 1)->where('students.data.0.id', $academic->id));
        $this->assertTrue(app(AcademicAccessService::class)->decision($academic->fresh(), 'assignments_submit')['allowed']);
        $this->actingAs($student)->get('/dashboard/student/payments/'.$payment->uuid.'/receipt')->assertOk()->assertSee('BANK-HTTP');
    }

    public function test_jury_passage_creates_a_renewal_only_when_the_student_starts_it(): void
    {
        [$admin, $student, $application, $source] = $this->admitted(true);
        $level = Level::create(['faculty_id' => $source->level->faculty_id, 'title' => 'Licence 2', 'code' => 'L2', 'is_active' => true]);
        LevelDetail::create(['level_id' => $level->id, 'price_national_first' => '60.00', 'price_national_second' => '70.00']);
        $year = AcademicYear::create(['title' => '2027–2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'draft']);
        $adminUrl = '/dashboard/admin/student-academic';
        $decisionUrl = $adminUrl.'/'.$source->id.'/progression';
        $payload = ['level_id' => $level->id, 'academic_year_id' => $year->id, 'reason' => 'Décision de passage du jury PV-2027-001.'];

        $this->actingAs($student)->post($decisionUrl, $payload)->assertForbidden();
        $this->actingAs($admin)->post($decisionUrl, array_replace($payload, ['academic_year_id' => $source->academic_year_id]))
            ->assertSessionHasErrors('academic_year_id');
        $this->post($decisionUrl, $payload)->assertSessionHasNoErrors();
        $this->post($decisionUrl, $payload)->assertSessionHasNoErrors();
        $this->assertSame('completed', $source->fresh()->enrollment_status);
        $this->assertDatabaseCount('academic_enrollments', 1);
        $decision = \App\Models\Student\AcademicProgression::firstOrFail();
        $this->get($adminUrl.'/renewals')->assertInertia(fn (Assert $p) => $p->where('decisions.data.0.id', $decision->id)->where('decisions.data.0.target_id', null));

        $overview = '/dashboard/student/overview?academic='.$source->id;
        $start = '/dashboard/student/renewals/'.$decision->id;
        $this->actingAs($student)->get($overview)->assertInertia(fn (Assert $p) => $p
            ->where('progression.level', 'Licence 2')->where('progression.year', '2027–2028')->where('progression.can_start', false));
        $this->post($start)->assertSessionHasErrors('progression');
        $year->update(['status' => 'open']);
        $this->get($overview)->assertInertia(fn (Assert $p) => $p->where('progression.can_start', true));

        $other = $this->user('other-renewal@example.test');
        $otherSource = Enrollment::create(['student_id' => $other->id, 'level_id' => $source->level_id, 'academic_year_id' => $source->academic_year_id, 'status' => 'validated']);
        app(StudentAdmissionService::class)->activate($otherSource, $admin->id, false);
        $this->actingAs($other->fresh())->post($start)->assertNotFound();

        $this->actingAs($student)->post($start)->assertSessionHasNoErrors();
        $target = $decision->fresh()->target;
        $this->post($start)->assertRedirect(route('dashboard.student.index', ['section' => 'fees', 'academic' => $target->id]));
        $this->assertDatabaseCount('academic_enrollments', 3);
        $this->assertSame($source->id, $application->academicEnrollment()->firstOrFail()->id);
        $this->assertSame('pending_confirmation', $target->enrollment_status);
        $history = $adminUrl.'?tab=students&history=1';
        $this->actingAs($admin)->get($history)->assertInertia(fn (Assert $p) => $p
            ->where('students.data.0.id', $target->id));
        $this->get($history.'&year='.$source->academic_year_id.'&enrollment_status=completed')->assertInertia(fn (Assert $p) => $p
            ->has('students.data', 1)->where('students.data.0.id', $source->id));
        $this->get($adminUrl.'/'.$source->id.'?history=1&year='.$source->academic_year_id)->assertInertia(fn (Assert $p) => $p
            ->where('directoryFilters.history', '1')->where('directoryFilters.year', (string) $source->academic_year_id));
        $this->actingAs($student);
        $this->assertSame($source->matricule, $target->matricule);
        $this->assertSame(6000, (int) $target->obligations()->where('installment', 1)->value('amount_cents'));
        $this->payment($target, $admin, '40.00');
        $this->assertSame('pending_confirmation', $target->fresh()->enrollment_status);
        app(StudentFinanceService::class)->adjust($target, $admin, ['type' => 'scholarship', 'amount' => '20.00', 'reason' => 'Aide validée pour la nouvelle année.']);
        $this->get('/dashboard/student/fees?academic='.$target->id)->assertInertia(fn (Assert $p) => $p
            ->where('academic.level', 'Licence 2')->where('progression.status', 'confirmed'));
        $this->assertSame('completed', $source->fresh()->enrollment_status);
    }

    public function test_payment_and_valid_aid_combine_to_confirm_the_first_installment_once(): void
    {
        [$admin, , $application] = $this->application();
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasNoErrors();
        $academic = $application->academicEnrollment()->firstOrFail();
        $finance = app(StudentFinanceService::class);
        $finance->assess($academic, $admin, 'national');
        $this->payment($academic, $admin, '20.00');
        $finance->adjust($academic, $admin, [
            'type' => 'scholarship', 'amount' => '30.00', 'reason' => 'Bourse validée couvrant le solde de la première tranche.',
            'starts_at' => today('Africa/Kinshasa')->addDay()->toDateString(),
        ]);
        $this->assertSame('pending_confirmation', $academic->fresh()->enrollment_status);
        $this->travel(1)->days();
        $this->artisan('student:confirm-covered-enrollments')->assertSuccessful();
        $this->artisan('student:confirm-covered-enrollments')->assertSuccessful();
        $this->assertSame('confirmed', $academic->fresh()->enrollment_status);
        $this->assertSame(5000, $finance->balance($academic, 'tuition')['balance_cents']);
        $this->assertSame(1, DB::table('academic_audits')->where('action', 'academic_enrollment_confirmed')->count());
    }

    public function test_verified_provider_payment_can_complete_coverage_with_a_valid_scholarship(): void
    {
        [$admin, , $application] = $this->application();
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasNoErrors();
        $academic = $application->academicEnrollment()->firstOrFail();
        $finance = app(StudentFinanceService::class);
        $finance->assess($academic, $admin, 'national');
        $payment = $this->payment($academic, $admin, '20.00', 'pending');
        $finance->adjust($academic, $admin, ['type' => 'scholarship', 'amount' => '30.00', 'reason' => 'Bourse partielle validée par la comptabilité.']);
        $this->assertSame('pending_confirmation', $academic->fresh()->enrollment_status);

        $verifier = new class($payment) implements PaymentProviderVerifier
        {
            public function __construct(private StudentPayment $payment) {}

            public function verify(array $serverPayload): VerifiedPayment
            {
                return new VerifiedPayment($this->payment->reference, 2000, $this->payment->currency);
            }
        };
        app()->instance($verifier::class, $verifier);
        config(['student.payment_verifier' => $verifier::class]);
        app(ProviderPaymentReconciliation::class)->reconcile([]);
        app(ProviderPaymentReconciliation::class)->reconcile([]);
        $this->assertSame('confirmed', $academic->fresh()->enrollment_status);
        $this->assertSame(1, DB::table('academic_audits')->where('action', 'academic_enrollment_confirmed')->count());
    }

    public function test_valid_exemption_alone_confirms_a_pending_enrollment(): void
    {
        [$admin, , $application] = $this->application();
        $this->actingAs($admin)->post('/dashboard/admin/enrollments/'.$application->id.'/validate')->assertSessionHasNoErrors();
        $academic = $application->academicEnrollment()->firstOrFail();
        $finance = app(StudentFinanceService::class);
        $finance->assess($academic, $admin, 'national');
        $finance->adjust($academic, $admin, ['type' => 'exemption', 'reason' => 'Exonération validée par la comptabilité.']);
        $this->assertSame('confirmed', $academic->fresh()->enrollment_status);
        $this->assertDatabaseCount('student_payments', 0);
    }

    public function test_private_work_is_stored_and_staff_can_access_only_after_authorization(): void
    {
        [$admin,$student,,$academic,,$assignment] = $this->admitted(true);
        $this->rule($admin, mode: 'open');
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['file' => UploadedFile::fake()->createWithContent('travail.pdf', "%PDF-1.4\nCopie de test\n%%EOF\n")])->assertSessionHasNoErrors();
        $work = AcademicSubmission::firstOrFail();
        Storage::disk('local')->assertExists($work->path);
        $this->get('/dashboard/student/submissions/'.$work->id.'/download')->assertOk()->assertDownload('travail.pdf');
        $this->get('/dashboard/admin/student-academic/submissions/'.$work->id.'/download')->assertForbidden();
        $this->actingAs($admin)->get('/dashboard/admin/student-academic/submissions/'.$work->id.'/download')->assertOk()->assertDownload('travail.pdf');
        $assignment->update(['closes_at' => now()->subHour()]);
        $this->actingAs($student)->post('/dashboard/student/resources/'.$assignment->id.'/submit', ['body' => 'Hors délai'])->assertForbidden();
    }

    public function test_no_payment_provider_is_assumed_or_simulated(): void
    {
        [$admin,$student,,$academic] = $this->admitted(true);
        $payment = $this->payment($academic, $admin, '100.00', 'pending');
        try {
            app(ProviderPaymentReconciliation::class)->reconcile(['reference' => $payment->reference, 'success' => true]);
            $this->fail('Un retour client ne doit jamais confirmer un paiement.');
        } catch (\LogicException $exception) {
            $this->assertStringContainsString('Aucun prestataire', $exception->getMessage());
        }
        $this->assertSame('pending', $payment->fresh()->status);
        $this->assertSame(0, app(StudentFinanceService::class)->balance($academic)['paid_cents']);
    }

    public function test_source_dossier_uses_the_financial_ledger_without_mutating_its_legacy_payment_flag(): void
    {
        [$admin,$student,$application,$academic] = $this->admitted(true);
        $this->payment($academic, $admin, '100.00');
        $this->actingAs($student)->get('/dashboard/enrollments/'.$application->uuid)->assertInertia(fn (Assert $p) => $p->where('enrollment.payment_status', 'paid')->where('enrollment.academic_portal_url', '/dashboard/student?application='.$application->uuid));
        $this->assertSame('unpaid', $application->fresh()->payment_status->value);
    }

    public function test_hidden_service_is_removed_from_payload_and_direct_routes_are_denied(): void
    {
        [$admin,$student,,$academic,,$assignment,$material] = $this->admitted(true);
        $this->rule($admin, 'materials_download', 'hidden');
        $this->actingAs($student)->get('/dashboard/student')->assertInertia(fn (Assert $p) => $p->where('permissions.materials_download.visible', false)->where('resources', fn ($items) => ! collect($items)->contains('id', $material->id)));
        $this->get('/dashboard/student/materials')->assertForbidden();
        $this->get('/dashboard/student/resources/'.$material->id.'/download')->assertForbidden();
    }

    public function test_welcome_is_personal_persisted_and_acknowledged_only_once(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $url = '/dashboard/student?application='.$application->uuid.'&welcome=1';
        $this->actingAs($student)->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->where('welcome_pending', true));
        $this->from($url)->post('/dashboard/student/welcome/acknowledge?academic='.$academic->id)->assertRedirect($url);
        $seen = $student->fresh()->studentProfile->welcome_seen_at;
        $this->assertNotNull($seen);
        $this->travel(1)->day();
        $this->post('/dashboard/student/welcome/acknowledge?academic='.$academic->id)->assertRedirect();
        $this->assertTrue($seen->equalTo($student->fresh()->studentProfile->welcome_seen_at));
        $this->get($url)->assertInertia(fn (Assert $page) => $page->where('welcome_pending', false));
        $outsider = $this->user('welcome-outsider@example.test', 'student');
        $this->actingAs($outsider)->post('/dashboard/student/welcome/acknowledge?academic='.$academic->id)->assertForbidden();
    }

    public function test_validation_email_links_to_authenticated_student_welcome(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $content = (new EnrollmentReviewUpdated($application->fresh(), 'validated'))->content();
        $this->assertSame(url('/dashboard/student?application='.$application->uuid.'&welcome=1'), $content->with['actionUrl']);
        auth()->logout();
        $this->get($content->with['actionUrl'])->assertRedirect(route('login'));
        $this->assertSame($content->with['actionUrl'], session('url.intended'));
    }

    public function test_student_module_landing_pages_preserve_owned_academic_context(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        foreach (['profile', 'academics', 'assessments', 'services'] as $section) {
            $this->actingAs($student)->get('/dashboard/student/'.$section.'?academic='.$academic->id)
                ->assertOk()->assertInertia(fn (Assert $page) => $page->component('dashboard/student/Portal')->where('section', $section)->where('academic.id', $academic->id));
        }
        $outsider = $this->user('modules-outsider@example.test', 'student');
        $this->actingAs($outsider)->get('/dashboard/student/profile?academic='.$academic->id)->assertForbidden();
        $this->actingAs($student)->get('/dashboard/student/library')->assertNotFound();
    }

    public function test_student_calendar_is_scoped_to_the_selected_week_year_and_group_and_includes_teacher(): void
    {
        [$admin, $student, , $academic, $offering] = $this->admitted();
        $teacher = Professor::create(['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => 'calendar@example.test']);
        $offering->update(['professor_id' => $teacher->id]);
        $create = function ($target, $date, $published = true) {
            return AcademicSession::create(['academic_offering_id' => $target->id,
                'starts_at' => CarbonImmutable::parse($date.' 08:00', 'Africa/Kinshasa')->utc(),
                'ends_at' => CarbonImmutable::parse($date.' 10:00', 'Africa/Kinshasa')->utc(),
                'room' => 'Auditoire A', 'is_published' => $published]);
        };
        foreach (['2026-10-26', '2026-11-02', '2026-11-09'] as $date) {
            $create($offering, $date);
        }
        $create($offering, '2026-11-03', false);
        $intake = DB::table('intakes')->insertGetId(['name' => 'Autre groupe']);
        $class = DB::table('classes')->insertGetId(['faculty_id' => $academic->level->faculty_id, 'level_id' => $academic->level_id, 'intake_id' => $intake]);
        $foreignGroup = AcademicOffering::create(['course_id' => $offering->course_id, 'level_id' => $academic->level_id, 'academic_year_id' => $academic->academic_year_id, 'class_id' => $class, 'is_published' => true]);
        $create($foreignGroup, '2026-11-04');
        $year = DB::table('academic_years')->insertGetId(['title' => 'Autre année', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30', 'status' => 'closed']);
        $foreignYear = AcademicOffering::create(['course_id' => $offering->course_id, 'level_id' => $academic->level_id, 'academic_year_id' => $year, 'is_published' => true]);
        $create($foreignYear, '2026-11-05');
        $this->actingAs($student)->get('/dashboard/student/schedule?week=2026-11-04&academic='.$academic->id)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('schedule_week', '2026-11-02')->has('sessions', 1)->where('sessions.0.teacher', 'Anne Mbemba')->where('sessions.0.room', 'Auditoire A'));
        $this->get('/dashboard/student/schedule?week=2026-11-09')->assertInertia(fn (Assert $page) => $page->has('sessions', 1)->where('schedule_week', '2026-11-09'));
        $this->get('/dashboard/student/schedule?week=2026-10-26')->assertInertia(fn (Assert $page) => $page->has('sessions', 1)->where('schedule_week', '2026-10-26'));
        $this->get('/dashboard/student/schedule?week=2026-11-16')->assertInertia(fn (Assert $page) => $page->has('sessions', 0));
        $this->get('/dashboard/student/schedule?week=invalid')->assertSessionHasErrors('week');
    }

    public function test_admin_managed_schedule_reaches_students_only_after_publication(): void
    {
        $this->travelTo(Carbon::parse('2026-11-02 07:00', 'Africa/Kinshasa')->utc());
        [$admin, $student, , , $offering] = $this->admitted();
        $offering->course->forceFill(['semester' => 1])->save();
        AcademicSemester::create(['academic_year_id' => $offering->academic_year_id, 'number' => 1, 'start_date' => '2026-10-01', 'end_date' => '2027-03-31']);
        $payload = ['academic_offering_id' => $offering->id, 'starts_at' => '2026-11-02T08:00', 'ends_at' => '2026-11-02T10:00', 'room' => 'Auditoire A', 'repeat_count' => 1, 'is_published' => false];
        $this->actingAs($admin)->post('/dashboard/admin/schedule', $payload)->assertSessionHasNoErrors();
        $session = AcademicSession::firstOrFail();
        $this->actingAs($student)->get('/dashboard/student/schedule')->assertInertia(fn (Assert $page) => $page->has('sessions', 0));
        $this->actingAs($admin)->put('/dashboard/admin/schedule/'.$session->id, array_replace($payload, ['is_published' => true]))->assertSessionHasNoErrors();
        $this->actingAs($student)->get('/dashboard/student/schedule')->assertInertia(fn (Assert $page) => $page
            ->has('sessions', 1)->where('sessions.0.room', 'Auditoire A')->where('sessions.0.course', 'Introduction au droit'));
        $this->actingAs($admin)->delete('/dashboard/admin/schedule/'.$session->id)->assertSessionHasErrors('session');
        $this->post('/dashboard/admin/schedule/'.$session->id.'/transition', ['action' => 'cancel', 'reason' => 'Annulation communiquée aux étudiants.'])->assertStatus(303);
        $this->assertNotNull($session->fresh()->cancelled_at);
        $this->actingAs($student)->get('/dashboard/student/schedule')->assertInertia(fn (Assert $page) => $page->has('sessions', 1)->where('sessions.0.status', 'cancelled'));
    }

    public function test_course_workspace_has_metadata_and_only_its_published_resources(): void
    {
        [$admin, $student, , $academic, $offering] = $this->admitted();
        $course = $offering->course;
        $course->forceFill(['semester' => 1, 'cmi_hours' => 30, 'td_hours' => 15, 'tp_hours' => 10, 'pedagogical_content' => 'Chapitre 1 : les sources du droit.'])->save();
        $professor = Professor::create(['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => 'course-prof@example.test']);
        $assistant = Professor::create(['first_name' => 'Paul', 'last_name' => 'Kiala', 'email' => 'course-assistant@example.test']);
        $offering->update(['professor_id' => $professor->id, 'assistant_professor_id' => $assistant->id, 'group_leader_name' => 'Marie Kabeya']);
        AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'video', 'title' => 'Vidéo du cours', 'url' => 'https://example.test/video', 'is_published' => true]);
        AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'video', 'title' => 'Brouillon privé', 'is_published' => false]);
        $url = '/dashboard/student/courses/'.$course->id;
        $this->actingAs($student)->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->component('dashboard/student/Course')
            ->where('course.cmi_hours', 30)->where('organization.0.teacher', 'Anne Mbemba')->where('organization.0.assistant', 'Paul Kiala')->where('organization.0.leader', 'Marie Kabeya')->where('counts.videos', 1));
        $this->get($url.'/videos')->assertInertia(fn (Assert $page) => $page->has('resources', 1)->where('resources.0.title', 'Vidéo du cours'));
        $this->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page->where('courses.0.detail_url', $url.'?academic='.$academic->id));
        $offering->update(['is_published' => false]);
        $this->get($url)->assertNotFound();
        $this->get($url.'/videos')->assertNotFound();
    }

    public function test_course_catalog_details_are_accessible_without_teaching_but_do_not_leak_other_courses(): void
    {
        [, $student, , $academic] = $this->admitted();
        $catalog = (new Courses)->forceFill(['level_id' => $academic->level_id, 'title' => 'Matière du catalogue', 'credits' => 3]);
        $catalog->save();
        $this->actingAs($student)->get('/dashboard/student/courses/'.$catalog->id)->assertOk()->assertInertia(fn (Assert $page) => $page->has('organization', 0)->where('course.title', 'Matière du catalogue'));
        $this->get('/dashboard/student/courses/99999')->assertNotFound();
        $this->get('/dashboard/student/courses/'.$catalog->id.'/files')->assertForbidden();
        $this->get('/dashboard/student/courses/'.$catalog->id.'?academic=999999')->assertNotFound();
    }

    public function test_staff_records_attendance_and_students_see_only_their_own_status(): void
    {
        $this->travelTo(Carbon::parse('2026-11-02 12:00', 'Africa/Kinshasa')->utc());
        [$admin, $student, , $academic, $offering] = $this->admitted();
        $other = $this->user('attendance-other@example.test');
        $source = Enrollment::create(['student_id' => $other->id, 'level_id' => $academic->level_id, 'academic_year_id' => $academic->academic_year_id, 'matricule' => 'ST-ATTENDANCE', 'status' => 'validated']);
        $otherEntry = app(StudentAdmissionService::class)->activate($source, $admin->id, false);
        $otherEntry->update(['enrollment_status' => 'confirmed']);
        $session = AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => now()->subHours(3), 'ends_at' => now()->subHour(), 'room' => 'A', 'is_published' => true]);
        $this->actingAs($admin)->get('/dashboard/admin/schedule/'.$session->id.'/attendance')->assertOk()->assertInertia(fn (Assert $page) => $page->has('students', 2));
        $this->post('/dashboard/admin/schedule/'.$session->id.'/attendance', ['records' => [['id' => $academic->id, 'status' => 'present'], ['id' => $otherEntry->id, 'status' => 'absent']]])->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/schedule/'.$session->id.'/attendance', ['records' => [['id' => 999999, 'status' => 'present']]])->assertSessionHasErrors('records');
        $url = '/dashboard/student/courses/'.$offering->course_id.'/attendance';
        $this->actingAs($student)->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->has('attendance.data', 1)->where('attendance.data.0.status', 'present')->where('attendance_stats.present', 1)->missing('attendance_stats.absent'));
        $this->actingAs($other->fresh())->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->where('attendance.data.0.status', 'absent'));
        $this->post('/dashboard/admin/schedule/'.$session->id.'/attendance', ['records' => [['id' => $academic->id, 'status' => 'absent']]])->assertForbidden();
        $future = AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHour(), 'room' => 'A', 'is_published' => true]);
        $this->actingAs($admin)->post('/dashboard/admin/schedule/'.$future->id.'/attendance', ['records' => [['id' => $academic->id, 'status' => 'present']]])->assertStatus(422);
    }

    public function test_course_links_require_safe_urls_and_can_be_published_by_staff(): void
    {
        [$admin, $student, , , $offering] = $this->admitted();
        $this->actingAs($admin)->post('/dashboard/admin/student-academic/resources', ['academic_offering_id' => $offering->id, 'kind' => 'online', 'title' => 'Cours en ligne', 'url' => 'javascript:alert(1)', 'is_published' => true])->assertSessionHasErrors('url');
        $this->post('/dashboard/admin/student-academic/resources', ['academic_offering_id' => $offering->id, 'kind' => 'online', 'title' => 'Cours en ligne', 'url' => 'https://example.test/class', 'is_published' => true])->assertSessionHasNoErrors();
        $this->actingAs($student)->get('/dashboard/student/courses/'.$offering->course_id.'/online')->assertOk()->assertInertia(fn (Assert $page) => $page->has('resources', 1)->where('resources.0.url', 'https://example.test/class'));
    }

    public function test_overview_uses_kinshasa_day_week_and_only_published_assigned_sessions(): void
    {
        $this->travelTo(Carbon::parse('2026-11-02 23:30:00', 'Africa/Kinshasa')->utc());
        [$admin, $student, $application, $academic, $offering] = $this->admitted();
        $offering->course->forceFill(['semester' => 1])->save();
        foreach ([['2026-11-02 21:00', '2026-11-02 22:00', true], ['2026-11-02 23:00', '2026-11-03 00:00', true], ['2026-11-02 23:45', '2026-11-03 00:15', true], ['2026-11-03 00:15', '2026-11-03 01:00', true], ['2026-11-09 09:00', '2026-11-09 10:00', true], ['2026-11-02 23:40', '2026-11-03 00:00', false]] as [$start, $end, $published]) {
            AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => Carbon::parse($start, 'Africa/Kinshasa')->utc(), 'ends_at' => Carbon::parse($end, 'Africa/Kinshasa')->utc(), 'room' => 'Salle réelle', 'is_published' => $published]);
        }
        $this->actingAs($student)->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page
            ->where('overview.timezone', 'Africa/Kinshasa')->where('overview.today_count', 3)->where('overview.week_count', 4)
            ->has('overview.today_sessions', 3)->where('overview.today_sessions.0.ongoing', false)->where('overview.today_sessions.1.ongoing', true)->has('overview.week_sessions', 4)->where('overview.week_sessions.0.semester', '1er semestre'));
        $this->get('/dashboard/student/overview?academic='.$academic->id.'&week=2026-11-11')->assertInertia(fn (Assert $page) => $page
            ->where('overview.schedule_week', '2026-11-09')->has('overview.week_sessions', 1)
            ->where('overview.week_sessions.0.course_id', $offering->course_id)->where('overview.week_sessions.0.room', 'Salle réelle'));
    }

    public function test_overview_results_are_personal_published_and_financially_protected(): void
    {
        [$admin, $student, $application, $academic, $offering] = $this->admitted(true);
        $other = $this->user('other-result@example.test', 'student');
        $otherProfile = StudentProfile::create(['user_id' => $other->id, 'student_status' => 'active']);
        foreach ([[$academic->student_profile_id, true, 'Résultat personnel'], [$otherProfile->id, true, 'Résultat autre étudiant'], [$academic->student_profile_id, false, 'Brouillon personnel'], [null, true, 'Résultat non nominatif']] as [$target, $published, $title]) {
            AcademicResource::create(['academic_offering_id' => $offering->id, 'student_profile_id' => $target, 'kind' => 'result', 'title' => $title, 'body' => 'Note publiée : 16/20', 'is_published' => $published]);
        }
        $this->actingAs($student)->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page->has('overview.latest_results', 1)->where('overview.latest_results.0.title', 'Résultat personnel')->where('overview.latest_results.0.excerpt', 'Note publiée : 16/20'));
        $this->rule($admin, 'results_view', 'full', ['regulation_reference' => 'Règlement institutionnel adopté', 'regulation_confirmed' => true]);
        $this->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page->has('overview.latest_results', 0));
    }

    public function test_overview_alerts_and_announcements_reflect_real_finances_documents_and_publications(): void
    {
        $this->travelTo(Carbon::parse('2026-11-02 12:00:00', 'Africa/Kinshasa')->utc());
        [$admin, $student, $application, $academic, $offering] = $this->admitted();
        app(StudentFinanceService::class)->assess($academic, $admin, 'national', ['2026-10-31', '2026-12-01']);
        AdmissionCondition::create(['faculty_id' => $academic->level->faculty_id, 'level_id' => $academic->level_id, 'title' => 'Acte de naissance', 'section' => 'personal_info', 'is_required' => true]);
        AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'evaluation', 'title' => 'Évaluation publiée', 'opens_at' => now()->addDays(3), 'is_published' => true]);
        AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'announcement', 'title' => 'Annonce publiée', 'body' => 'Information réelle.', 'is_published' => true]);
        AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'announcement', 'title' => 'Annonce brouillon', 'is_published' => false]);
        $this->actingAs($student)->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page
            ->has('overview.alerts', 3)->where('overview.alerts.0.id', 'overdue')->where('overview.alerts.1.id', 'documents')->where('overview.alerts.2.id', 'evaluations')
            ->where('overview.missing_documents.0', 'Acte de naissance')->has('overview.announcements', 1)->where('overview.announcements.0.title', 'Annonce publiée')->has('overview.upcoming_evaluations', 1));
        $this->payment($academic, $admin, '50.00');
        $this->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page->has('overview.alerts', 2)->where('balance.overdue_cents', 0));
        $offering->update(['is_published' => false]);
        $this->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page->has('overview.announcements', 0)->has('overview.upcoming_evaluations', 0)->where('overview.course_count', 0));
    }

    public function test_faculty_matricule_sequence_is_shared_between_levels_and_years_and_reserved_uniquely(): void
    {
        [$admin, $student, $application] = $this->application();
        $generator = app(MatriculeGenerator::class);
        $level = $application->level;
        $this->assertSame('DR0001', $generator->generate($level, $application->academicYear)->toString());
        $secondLevel = Level::create(['faculty_id' => $level->faculty_id, 'title' => 'Licence 2', 'code' => 'L2']);
        $nextYear = AcademicYear::create(['title' => '2027–2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'open']);
        $this->assertSame('DR0002', $generator->generate($secondLevel, $nextYear)->toString());
        $faculty = Faculty::create(['name' => 'Médecine', 'code' => 'MED']);
        $medicalLevel = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence 1', 'code' => 'MED-L1']);
        $this->assertSame('MED0001', $generator->generate($medicalLevel, $nextYear)->toString());
        $this->assertSame('DR0003', $generator->generate($level, $nextYear)->toString());
        $this->assertSame('ST-2026-0001', $application->fresh()->matricule);
    }

    public function test_faculty_matricule_bootstraps_existing_numbers_and_retains_legacy_parsing(): void
    {
        [$admin, $student, $application] = $this->application();
        $application->update(['matricule' => 'DR0042']);
        $generator = app(MatriculeGenerator::class);
        $new = $generator->generate($application->level, $application->academicYear);
        $this->assertSame('DR0043', $new->toString());
        $this->assertSame('DR', $new->getFacultyCode());
        $this->assertSame(43, $new->getSequence());
        $this->assertNull($new->getYear());
        $legacy = Matricule::fromString('20260100001');
        $this->assertSame(2026, $legacy->getYear());
        $this->assertSame(1, $legacy->getSequence());
        $this->assertSame('MED10000', Matricule::generate('MED', 10000)->toString());
    }

    public function test_invalid_faculty_code_does_not_silently_generate_an_unrelated_matricule(): void
    {
        [$admin, $student, $application] = $this->application();
        $application->level->faculty->update(['code' => 'BAD-CODE']);
        $this->expectException(ValidationException::class);
        app(MatriculeGenerator::class)->generate($application->level, $application->academicYear);
    }

    public function test_existing_matricules_are_migrated_atomically_everywhere_and_retries_are_idempotent(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $service = app(StudentMatriculeMigration::class);
        $preview = $service->run(true);
        $this->assertSame('DR0001', $preview[0]['matricule']);
        $this->assertSame('ST-2026-0001', $application->fresh()->matricule);
        $this->assertSame('ST-2026-0001', $student->fresh()->studentProfile->matricule);
        $this->assertSame('ST-2026-0001', $academic->fresh()->matricule);
        $service->run();
        $this->assertSame('DR0001', $application->fresh()->matricule);
        $this->assertSame('DR0001', $student->fresh()->studentProfile->matricule);
        $this->assertSame('DR0001', $academic->fresh()->matricule);
        $this->assertSame([], $service->run());
        $this->actingAs($student)->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page->where('academic.matricule', 'DR0001'));
        $this->actingAs($admin)->get('/dashboard/admin/enrollments/'.$application->id)->assertOk();
    }

    public function test_matricule_migration_rolls_back_all_changes_when_a_faculty_code_is_invalid(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $application->level->faculty->update(['code' => 'BAD-CODE']);
        $this->artisan('student:migrate-matricules')->assertExitCode(1);
        $this->assertSame('ST-2026-0001', $academic->fresh()->matricule);
        $this->assertSame('ST-2026-0001', $application->fresh()->matricule);
    }

    public function test_home_reminder_uses_fees_by_category_and_current_evaluation_windows(): void
    {
        $this->travelTo(Carbon::parse('2026-11-02 12:00:00', 'Africa/Kinshasa')->utc());
        [$admin, $student, $application, $academic, $offering] = $this->admitted(true);
        app(StudentFinanceService::class)->addObligation($academic, $admin, ['kind' => 'laboratory', 'title' => 'Laboratoire', 'installment' => 1, 'amount' => '25.00', 'reason' => 'Frais de laboratoire applicables.']);
        foreach ([['En cours', now()->subHour(), now()->addHour()], ['Terminée', now()->subDays(2), now()->subDay()], ['À venir', now()->addDay(), now()->addDays(2)]] as [$title, $start, $end]) {
            AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'evaluation', 'title' => $title, 'body' => 'Énoncé confidentiel', 'opens_at' => $start, 'closes_at' => $end, 'is_published' => true]);
        }
        $this->actingAs($student)->get('/dashboard/student')->assertInertia(fn (Assert $page) => $page
            ->has('overview.fee_summary', 2)->has('overview.ongoing_evaluations', 1)->where('overview.ongoing_evaluations.0.title', 'En cours')->where('overview.ongoing_evaluations.0.excerpt', '')
            ->where('balance.balance_cents', 12500));
    }

    public function test_profile_can_be_completed_without_changing_academic_identity_or_source_documents(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $payload = ['first_name' => 'Marie', 'last_name' => 'Étudiante', 'post_name' => 'Test', 'email' => $student->email, 'gender' => 'female', 'birth_date' => '2003-05-15', 'birth_place' => 'Kinshasa', 'marital_status' => 'single', 'phone' => '+243 810 000 000', 'province' => 'Kinshasa', 'territory' => 'Mont-Ngafula', 'sector' => 'Centre', 'residence_commune' => 'Limete', 'home_address' => '12 avenue Test', 'description' => 'Présentation personnelle.', 'emergency_name' => 'Contact Test', 'emergency_relationship' => 'Parent', 'emergency_phone' => '+243 820 000 000', 'diploma_type' => 'state_diploma', 'diploma_number' => 'DIP-123', 'diploma_section' => 'Sciences', 'diploma_school' => 'Institut Test', 'diploma_year' => '2021'];
        $beforeDocuments = $application->documents()->pluck('path')->all();
        $this->actingAs($student)->from('/dashboard/student/profile?academic='.$academic->id)->post('/dashboard/student/profile?academic='.$academic->id, $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertSame('Marie', $student->fresh()->first_name);
        $this->assertSame('Kinshasa', $student->fresh()->studentProfile->personal_details['province']);
        $this->assertSame('DIP-123', $student->fresh()->studentProfile->personal_details['diploma_number']);
        $this->assertSame('ST-2026-0001', $application->fresh()->matricule);
        $this->assertSame($beforeDocuments, $application->documents()->pluck('path')->all());
        $this->get('/dashboard/student/profile')->assertInertia(fn (Assert $page) => $page->has('profile_form.provinces', 26)->where('profile_form.values.birth_date', '2003-05-15')->where('academic.phone', '+243 810 000 000'));
        $this->post('/dashboard/student/profile', array_merge($payload, ['matricule' => 'HACK0001']))->assertSessionHasErrors('matricule');
        $this->assertSame('ST-2026-0001', $academic->fresh()->matricule);
    }

    public function test_profile_photo_is_private_validated_and_can_be_replaced_without_altering_admission_proofs(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $directory = '/dashboard/admin/student-academic';
        $photo = $directory.'/'.$academic->id.'/photo';
        $this->actingAs($admin)->get($directory)->assertInertia(fn (Assert $page) => $page->where('students.data.0.photo_url', null));
        $this->get($photo)->assertNotFound();
        $payload = ['first_name' => $student->first_name, 'last_name' => $student->last_name, 'email' => $student->email];
        $this->actingAs($student)->post('/dashboard/student/profile?academic='.$academic->id, array_merge($payload, ['photo' => UploadedFile::fake()->image('portrait.jpg', 200, 200)]))->assertSessionHasNoErrors();
        $old = $student->fresh()->studentProfile->photo_path;
        Storage::disk('local')->assertExists($old);
        $this->get('/dashboard/student/profile/photo?academic='.$academic->id)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->post('/dashboard/student/profile', array_merge($payload, ['photo' => UploadedFile::fake()->image('nouveau.png', 200, 200)]))->assertSessionHasNoErrors();
        Storage::disk('local')->assertMissing($old);
        $this->assertSame('accepted', $application->documents()->first()->review_status);
        $other = $this->user('profile-other@example.test', 'student');
        $this->actingAs($other)->get('/dashboard/student/profile/photo?academic='.$academic->id)->assertForbidden();
        $this->get($photo)->assertForbidden();
        $this->actingAs($student)->post('/dashboard/student/profile', array_merge($payload, ['photo' => UploadedFile::fake()->create('invalid.svg', 1, 'image/svg+xml')]))->assertSessionHasErrors('photo');
        $this->get($photo)->assertForbidden();
        $this->actingAs($admin)->get($photo)->assertOk()->assertHeader('Content-Type', 'image/png');
        foreach (['table', 'grid'] as $view) {
            $this->get($directory.'?view='.$view)->assertInertia(fn (Assert $page) => $page
                ->where('students.data.0.photo_url', fn (string $url) => str_starts_with($url, $photo.'?v=')));
        }
    }

    public function test_profile_password_requires_current_password_and_does_not_log_secrets(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $this->actingAs($student)->post('/dashboard/student/profile/password', ['current_password' => 'incorrect', 'password' => 'NewPassword2026', 'password_confirmation' => 'NewPassword2026'])->assertSessionHasErrorsIn('studentPassword', 'current_password');
        $this->assertTrue(Hash::check('password', $student->fresh()->password));
        $this->post('/dashboard/student/profile/password', ['current_password' => 'password', 'password' => 'NewPassword2026', 'password_confirmation' => 'NewPassword2026'])->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('NewPassword2026', $student->fresh()->password));
        $this->assertFalse(Hash::check('password', $student->fresh()->password));
        $this->assertStringNotContainsString('NewPassword2026', DB::table('academic_audits')->get()->toJson());
    }

    public function test_profile_email_change_is_protected_and_requires_new_verification(): void
    {
        Notification::fake();
        [$admin, $student, $application, $academic] = $this->admitted();
        $payload = ['first_name' => $student->first_name, 'last_name' => $student->last_name, 'email' => 'new-profile@example.test'];
        $this->actingAs($student)->post('/dashboard/student/profile', $payload)->assertSessionHasErrors('email_current_password');
        $this->assertSame('student@example.test', $student->fresh()->email);
        $this->post('/dashboard/student/profile', array_merge($payload, ['email_current_password' => 'password']))->assertSessionHasNoErrors()->assertRedirect(route('verification.notice'));
        $this->assertNull($student->fresh()->email_verified_at);
        $this->assertSame('new-profile@example.test', $student->fresh()->email);
        Notification::assertSentTo($student->fresh(), VerifyEmail::class);
    }

    public function test_profile_validates_birth_date_other_province_and_emergency_contact(): void
    {
        [$admin, $student, $application, $academic] = $this->admitted();
        $this->actingAs($student)->post('/dashboard/student/profile', ['first_name' => $student->first_name, 'last_name' => $student->last_name, 'email' => $student->email, 'birth_date' => now()->addYear()->format('Y-m-d'), 'province' => 'other', 'diploma_type' => 'other', 'emergency_name' => 'Contact sans numéro'])->assertSessionHasErrors(['birth_date', 'other_province', 'other_diploma', 'emergency_phone']);
        $this->assertNull($student->fresh()->studentProfile->personal_details);
    }
}
