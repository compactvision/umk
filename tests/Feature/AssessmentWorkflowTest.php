<?php

namespace Tests\Feature;

use App\Models\Courses;
use App\Models\Enrollment;
use App\Models\Professor;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\AccessRule;
use App\Models\Student\AssessmentHandoff;
use App\Models\Student\AssessmentRecord;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\Assessment\Application\AssessmentSubmissions;
use App\Modules\Student\Application\Services\Audit;
use App\Notifications\AcademicAssessmentNotice;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

final class AssessmentWorkflowTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private const TEACHER = '/dashboard/teacher/assessments';

    private const ADMIN = '/dashboard/admin/assessments';

    private const STUDENT = '/dashboard/student/resources';

    private const REASON = 'Décision pédagogique documentée.';

    private function context(): array
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-10 10:00:00', 'Africa/Kinshasa'));
        Storage::fake('local');
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->sole();
        foreach (['assignments_submit', 'evaluations_participate', 'materials_download'] as $feature) {
            AccessRule::create(['feature' => $feature, 'mode' => 'open', 'is_active' => true, 'level_id' => $entry->level_id]);
        }
        $teacher = $this->teacher();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'))->givePermissionTo(Permission::findOrCreate('publish academic content', 'web'));
        $offer = $this->offer($entry, $teacher);

        return [$student, $entry, $teacher, $admin, $offer];
    }

    private function offer(AcademicEnrollment $entry, User $teacher): AcademicOffering
    {
        $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'title' => 'Méthodes', 'code' => Str::random(10), 'semester' => 1]);
        $course->save();

        return AcademicOffering::create(['academic_year_id' => $entry->academic_year_id, 'level_id' => $entry->level_id, 'course_id' => $course->id,
            'is_published' => true, 'professor_id' => Professor::where('user_id', $teacher->id)->value('id')]);
    }

    private function teacher(): User
    {
        $teacher = User::factory()->create();
        $teacher->assignRole(Role::findOrCreate('professor', 'web'))->givePermissionTo(Permission::findOrCreate('manage courses', 'web'));
        Professor::create(['first_name' => 'Odile', 'last_name' => 'Kasa', 'email' => $teacher->email, 'is_active' => true])
            ->forceFill(['user_id' => $teacher->id, 'photo' => 'professors/test-portrait.png'])->save();

        return $teacher;
    }

    private function peer(AcademicEnrollment $entry): User
    {
        $peer = User::factory()->create();
        $peer->assignRole('student');
        $application = Enrollment::create(['student_id' => $peer->id, 'level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id, 'status' => 'validated']);
        $profile = StudentProfile::create(['user_id' => $peer->id, 'student_status' => 'active']);
        AcademicEnrollment::create(['student_profile_id' => $profile->id, 'application_id' => $application->id, 'level_id' => $entry->level_id,
            'academic_year_id' => $entry->academic_year_id, 'enrollment_status' => 'confirmed', 'currency' => 'USD']);

        return $peer;
    }

    private function details(array $override = []): array
    {
        return $override + ['title' => 'Rapport de méthodes', 'category' => 'practical', 'session_code' => 'ordinaire',
            'modality' => 'submission', 'opens_at' => '2026-11-10T09:00', 'closes_at' => '2026-11-10T11:00',
            'maximum_points' => '20', 'attempt_limit' => 2, 'late_minutes' => 30,
            'group_work' => false, 'feedback_policy' => 'validated', 'body' => 'Consignes du travail.'];
    }

    private function draft(AcademicOffering $offer, array $override = []): AcademicResource
    {
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->details($override))->assertStatus(303)->assertSessionHasNoErrors();

        return $offer->resources()->latest('id')->firstOrFail();
    }

    private function life(AcademicResource $resource, string $action, bool $notify = false)
    {
        return $this->post(self::TEACHER.'/'.$resource->id.'/lifecycle', ['action' => $action, 'revision' => $resource->assessment()->sole()->revision,
            'reason' => self::REASON, 'notify' => $notify]);
    }

    private function submit(AcademicResource $resource, int $version, array $data = [])
    {
        return $this->post(self::STUDENT.'/'.$resource->id.'/submit', $data + [
            'body' => 'Texte de remise.', 'operation_key' => (string) Str::uuid(), 'expected_version' => $version,
        ]);
    }

    private function correct(AcademicResource $resource, AssessmentRecord $record, array $data = [])
    {
        return $this->post(self::TEACHER.'/'.$resource->id.'/records/'.$record->id.'/correction', $data + [
            'revision' => $record->fresh()->revision, 'participation' => $record->fresh()->participation, 'reason' => self::REASON,
        ]);
    }

    private function correctionState(AcademicResource $resource, AssessmentRecord $record, string $action, string $prefix = self::TEACHER)
    {
        return $this->post($prefix.'/'.$resource->id.'/records/'.$record->id.'/state', [
            'action' => $action, 'revision' => $record->fresh()->revision, 'reason' => self::REASON,
        ]);
    }

    private function batch(AcademicResource $resource, string $action, string $prefix = self::ADMIN, bool $notify = false)
    {
        return $this->post($prefix.'/'.$resource->id.'/batch', ['action' => $action, 'revision' => $resource->assessment()->sole()->revision,
            'reason' => self::REASON, 'notify' => $notify]);
    }

    public function test_draft_validates_time_rubric_and_authorization_then_freezes_published_settings(): void
    {
        [$student, , $teacher, $admin, $offer] = $this->context();
        $url = self::TEACHER.'/offerings/'.$offer->id;
        $this->actingAs($this->teacher())->post($url, $this->details())->assertForbidden();
        $this->actingAs($teacher)->post($url, $this->details(['closes_at' => '2026-11-10T08:00']))->assertSessionHasErrors('closes_at');
        $this->post($url, $this->details(['maximum_points' => '20.001']))->assertSessionHasErrors('maximum_points');
        $this->post($url, $this->details(['rubric' => [['label' => 'Analyse', 'maximum' => '10']]]))->assertSessionHasErrors('rubric');
        $work = $this->draft($offer);
        $this->get(self::TEACHER.'?resource='.$work->id)->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/teaching/Assessments')->where('selected.state', 'draft')->where('selected.maximum_points', 2000));
        $this->actingAs($student)->get('/dashboard/student/assignments')->assertInertia(fn (Assert $page) => $page->has('resources', 0));
        $this->submit($work, 0)->assertNotFound();
        $this->actingAs($admin)->post('/dashboard/admin/student-academic/publication/resources/'.$work->id,
            ['is_published' => true, 'reason' => self::REASON])->assertSessionHasErrors('resource');
        $this->actingAs($teacher);
        $this->life($work, 'publish', true)->assertStatus(303)->assertSessionHasNoErrors();
        $this->post(self::TEACHER.'/'.$work->id.'/edition', $this->details(['revision' => 2, 'reason' => self::REASON]))->assertSessionHasErrors('state');
        $notice = $student->notifications()->where('type', AcademicAssessmentNotice::class)->sole();
        $this->actingAs($student)->post(route('dashboard.notifications.open', $notice))->assertRedirectContains('work='.$work->id);
        $this->get('/dashboard/student/assignments')->assertInertia(fn (Assert $page) => $page
            ->where('resources.0.assessment.can_submit', true)->where('resources.0.assessment.maximum_points', 2000));
    }

    public function test_private_attempts_are_idempotent_versioned_late_and_bounded(): void
    {
        [$student, $entry, $teacher, $admin, $offer] = $this->context();
        $peer = $this->peer($entry);
        $this->actingAs($teacher);
        $work = $this->draft($offer);
        $this->life($work, 'publish')->assertStatus(303);
        $this->actingAs($student);
        $this->submit($work, 0, ['file' => UploadedFile::fake()->createWithContent('faux.pdf', 'texte')])->assertSessionHasErrors('file');
        $payload = ['operation_key' => (string) Str::uuid(), 'file' => UploadedFile::fake()->createWithContent('copie.pdf', "%PDF-1.4\nversion 1")];
        $this->submit($work, 0, $payload)->assertSessionHasNoErrors();
        $this->submit($work, 0, $payload)->assertSessionHasNoErrors();
        $this->submit($work, 0, $payload + ['body' => 'Tentative modifiée.'])->assertSessionHasErrors('operation_key');
        $this->travel(65)->minutes();
        $this->submit($work, 0)->assertSessionHasErrors('revision');
        $this->submit($work, 1, ['body' => 'Révision tardive.'])->assertSessionHasNoErrors();
        $this->submit($work, 2)->assertSessionHasErrors('file');
        $copy = AcademicSubmission::sole();
        $this->assertSame(2, $copy->version);
        $this->assertTrue($copy->versions()->where('number', 2)->sole()->late);
        $this->assertCount(1, Storage::disk('local')->allFiles('student-work'));
        $history = '/dashboard/student/submissions/'.$copy->id.'/versions/1';
        $this->get($history)->assertInertia(fn (Assert $page) => $page->where('number', 1)->where('body', 'Texte de remise.')->where('late', false)->missing('path'));
        $this->get('/dashboard/student/submissions/'.$copy->id.'/download?version=1')->assertDownload('copie.pdf');
        $this->actingAs($peer)->get($history)->assertNotFound();
        $student->studentProfile->update(['student_status' => 'suspended']);
        $this->actingAs($student);
        $this->submit($work, 2)->assertForbidden();

        $adminRoute = 'dashboard.admin.student-academic.';
        $parameters = ['submission' => $copy->id];
        $prior = route($adminRoute.'submissions.version', $parameters + ['version' => 1]);
        $latest = route($adminRoute.'submissions.version', $parameters + ['version' => 2]);
        $download = route($adminRoute.'submissions.download', $parameters + ['version' => 1]);
        $latestDownload = route($adminRoute.'submissions.download', $parameters + ['version' => 2]);
        $workList = route($adminRoute.'index', ['tab' => 'teaching', 'academic' => $entry->id]);
        $dossier = route($adminRoute.'show', ['academic' => $entry->id, 'section' => 'Académique']);

        $this->get($prior)->assertForbidden();
        $this->get($download)->assertForbidden();

        Role::findByName('admin', 'web')->revokePermissionTo('publish academic content');
        $restricted = User::factory()->create();
        $restricted->assignRole('admin')->givePermissionTo(Permission::findOrCreate('manage academic access', 'web'));
        $this->actingAs($restricted)->get($dossier)->assertInertia(fn (Assert $page) => $page->where('teachingSubmissionsUrl', null));
        $this->get($prior)->assertForbidden();
        $this->get($download)->assertForbidden();

        $this->actingAs($admin)->get($dossier)->assertInertia(fn (Assert $page) => $page->where('teachingSubmissionsUrl', $workList));
        $this->get(route($adminRoute.'index', ['tab' => 'students', 'academic' => $entry->id]))
            ->assertInertia(fn (Assert $page) => $page->has('submissions', 0));
        $this->get($workList)->assertInertia(fn (Assert $page) => $page->where('submissions.0.version_url', $latest));
        $this->get($latest)->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/student/SubmissionVersion')->where('administrative', true)
            ->where('number', 2)->where('body', 'Révision tardive.')->where('late', true)
            ->where('download_url', $latestDownload)
            ->where('previous_url', $prior)->where('next_url', null)->where('return_url', $workList)->missing('path'));
        $this->get($prior)->assertInertia(fn (Assert $page) => $page
            ->where('number', 1)->where('body', 'Texte de remise.')->where('late', false)
            ->where('previous_url', null)->where('next_url', $latest)->where('download_url', $download)->missing('path'));
        $this->get($download)->assertDownload('copie.pdf');
        $this->get($latestDownload)->assertDownload('copie.pdf');
        $this->get(route($adminRoute.'submissions.version', $parameters + ['version' => 3]))->assertNotFound();
        $this->get(route($adminRoute.'submissions.version', ['submission' => $copy->id + 1, 'version' => 1]))->assertNotFound();
    }

    public function test_pedagogical_validation_releases_a_private_revision_and_reopening_appends_a_handoff(): void
    {
        [$student, $entry, $teacher, $admin, $offer] = $this->context();
        $this->actingAs($teacher);
        $work = $this->draft($offer, ['rubric' => [['label' => 'Analyse', 'maximum' => '10'], ['label' => 'Présentation', 'maximum' => '10']]]);
        $this->life($work, 'publish')->assertStatus(303);
        $this->life($work, 'close')->assertSessionHasErrors('closes_at');
        $this->actingAs($student);
        $this->submit($work, 0)->assertSessionHasNoErrors();
        $this->travel(91)->minutes();
        $this->actingAs($teacher);
        $this->life($work, 'close')->assertStatus(303)->assertSessionHasNoErrors();
        $record = AssessmentRecord::sole();
        $this->correct($work, $record, ['criteria' => ['10.01', '3.00']])->assertSessionHasErrors('criteria');
        $this->correct($work, $record, ['criteria' => ['8.30', '7.20'], 'feedback' => 'Appréciation privée',
            'file' => UploadedFile::fake()->createWithContent('correction.pdf', '%PDF-1.4 corrigé')])->assertStatus(303);
        $this->correct($work, $record, ['revision' => 1, 'points' => '4'])->assertSessionHasErrors('revision');
        $this->correctionState($work, $record, 'finalize')->assertStatus(303);
        $this->batch($work, 'validate', self::TEACHER)->assertForbidden();
        $this->batch($work, 'release', self::TEACHER)->assertStatus(303);
        $this->actingAs($student)->get('/dashboard/student/assignments')->assertInertia(fn (Assert $page) => $page->where('resources.0.assessment.feedback', null));
        $this->get(self::STUDENT.'/'.$work->id.'/feedback')->assertNotFound();
        $this->actingAs($admin);
        $this->batch($work, 'validate')->assertStatus(303);
        $this->batch($work, 'validate')->assertStatus(303);
        $handoff = AssessmentHandoff::sole();
        $this->assertSame(1550, $handoff->payload['points_hundredths']);
        $this->assertSame($entry->id, $handoff->payload['academic_enrollment_id']);
        $this->get(self::ADMIN.'/handoff')->assertJsonPath('0.payload.result_key', 'assessment-record:'.$record->id)
            ->assertJsonMissingPath('0.payload.feedback')->assertJsonCount(1);
        $this->get(self::ADMIN.'/handoff?after='.$handoff->id)->assertJsonCount(0);
        $this->batch($work, 'release', self::ADMIN, true)->assertStatus(303);
        $this->actingAs($student)->get(self::STUDENT.'/'.$work->id.'/feedback')->assertDownload('correction.pdf');
        $this->get('/dashboard/student/assignments?activity=corrected')->assertInertia(fn (Assert $page) => $page
            ->where('resources.0.assessment.feedback.points', 1550)->where('resources.0.assessment.feedback.criteria.0.label', 'Analyse')->missing('resources.0.assessment.feedback.path'));
        $this->post(self::STUDENT.'/'.$work->id.'/review', ['body' => 'Veuillez revoir le premier critère.'])->assertStatus(303);
        $this->post(self::STUDENT.'/'.$work->id.'/review', ['body' => 'Veuillez revoir le premier critère.'])->assertStatus(303);
        $this->assertDatabaseCount('student_service_requests', 1);
        $this->actingAs($teacher);
        $this->correct($work, $record, ['points' => '10'])->assertSessionHasErrors('state');
        $this->correctionState($work, $record, 'reopen')->assertForbidden();
        $this->actingAs($admin);
        $this->correctionState($work, $record, 'reopen', self::ADMIN)->assertStatus(303);
        $this->actingAs($student)->get(self::STUDENT.'/'.$work->id.'/feedback')->assertNotFound();
        $this->actingAs($teacher);
        $this->correct($work, $record, ['criteria' => ['9', '8']])->assertStatus(303);
        $this->correctionState($work, $record, 'finalize')->assertStatus(303);
        $this->actingAs($admin);
        $this->batch($work, 'validate')->assertStatus(303);
        $this->assertDatabaseCount('academic_assessment_handoffs', 2);
        $this->assertSame(1550, $handoff->fresh()->payload['points_hundredths']);
        $this->assertSame(1700, AssessmentHandoff::latest('id')->firstOrFail()->payload['points_hundredths']);
        $this->batch($work, 'release')->assertStatus(303);
        $entry->academicYear->update(['status' => 'closed']);
        $this->actingAs($student)->get('/dashboard/student/assignments?activity=corrected')->assertInertia(fn (Assert $page) => $page
            ->where('resources.0.assessment.feedback.points', 1700)->where('resources.0.assessment.can_submit', false));
        $this->get(self::STUDENT.'/'.$work->id.'/feedback')->assertDownload('correction.pdf');
        AccessRule::create(['feature' => 'results_view', 'level_id' => $entry->level_id, 'mode' => 'hidden', 'is_active' => true]);
        $this->get(self::STUDENT.'/'.$work->id.'/feedback')->assertNotFound();
        $this->get('/dashboard/student/assignments?activity=corrected')->assertInertia(fn (Assert $page) => $page->has('resources', 0));

    }

    public function test_group_membership_is_fixed_and_only_the_leader_submits_for_individual_corrections(): void
    {
        [$student, $entry, $teacher, , $offer] = $this->context();
        $peer = $this->peer($entry);
        $peerEntry = $peer->studentProfile->enrollments()->sole();
        $outsider = $this->peer($entry);
        $this->actingAs($teacher);
        $work = $this->draft($offer, ['group_work' => true]);
        $members = ['label' => 'Groupe rouge', 'leader' => $entry->id, 'members' => [$entry->id, $peerEntry->id], 'reason' => self::REASON, 'revision' => 1];
        $this->post(self::TEACHER.'/'.$work->id.'/groups', $members)->assertStatus(303);
        $this->post(self::TEACHER.'/'.$work->id.'/groups', array_replace($members, ['revision' => 2, 'label' => 'Autre groupe']))->assertSessionHasErrors('members');
        $this->life($work, 'publish')->assertStatus(303);
        $this->actingAs($peer);
        $this->submit($work, 0)->assertForbidden();
        $this->actingAs($student);
        $this->submit($work, 0, ['file' => UploadedFile::fake()->createWithContent('groupe.pdf', '%PDF-1.4 groupe')])->assertSessionHasNoErrors();
        $copy = AcademicSubmission::sole();
        $this->actingAs($peer)->get('/dashboard/student/submissions/'.$copy->id.'/download')->assertDownload('groupe.pdf');
        $this->actingAs($outsider)->get('/dashboard/student/submissions/'.$copy->id.'/download')->assertNotFound();
        $this->travel(91)->minutes();
        $this->actingAs($teacher);
        $this->life($work, 'close')->assertStatus(303);
        $group = $work->assessment()->sole()->groups()->sole();
        $this->post(self::TEACHER.'/'.$work->id.'/groups/'.$group->id.'/score', ['points' => '15', 'revision' => 1, 'reason' => self::REASON])->assertStatus(303);
        $row = $group->records()->where('academic_enrollment_id', $peerEntry->id)->sole();
        $this->correct($work, $row, ['adjustment' => '-0.25'])->assertStatus(303);
        $this->assertSame(1475, $row->fresh()->points);
        $this->assertSame(2, $group->records()->count());
        $this->post(self::TEACHER.'/'.$work->id.'/groups/'.$group->id.'/score', ['points' => '16', 'revision' => 2, 'reason' => self::REASON])->assertSessionHasErrors('group');
    }

    public function test_in_person_exam_uses_the_scheduled_session_and_hands_off_absence_without_zero(): void
    {
        [$student, $entry, $teacher, $admin, $offer] = $this->context();
        $this->actingAs($teacher);
        $other = $this->offer($entry, $teacher);
        $sessionData = ['starts_at' => now()->addHour(), 'ends_at' => now()->addHours(2), 'room' => 'A-01', 'is_published' => true];
        $foreign = $other->sessions()->create($sessionData);
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->details(['category' => 'exam', 'modality' => 'in_person', 'academic_session_id' => $foreign->id]))
            ->assertSessionHasErrors('academic_session_id');
        $session = $offer->sessions()->create($sessionData);
        $work = $this->draft($offer, ['category' => 'exam', 'modality' => 'in_person', 'academic_session_id' => $session->id, 'session_code' => 'rattrapage']);
        $this->life($work, 'publish')->assertStatus(303);
        $this->actingAs($student);
        $this->submit($work, 0)->assertForbidden();
        $this->get('/dashboard/student/evaluations')->assertInertia(fn (Assert $page) => $page
            ->where('resources.0.assessment.session.room', 'A-01')->where('resources.0.assessment.can_submit', false));
        $this->travel(3)->hours();
        AcademicAttendance::create(['academic_enrollment_id' => $entry->id, 'academic_session_id' => $session->id,
            'status' => 'absent', 'recorded_by' => $admin->id]);
        $this->actingAs($teacher);
        $this->life($work, 'close')->assertStatus(303);
        $record = AssessmentRecord::sole();
        $this->assertSame('absent', $record->participation);
        $this->correct($work, $record, ['points' => '0'])->assertSessionHasErrors('points');
        $this->correctionState($work, $record, 'finalize')->assertStatus(303);
        $this->actingAs($admin);
        $this->batch($work, 'validate')->assertStatus(303);
        $result = AssessmentHandoff::sole()->payload;
        $this->assertSame('rattrapage', $result['session_code']);
        $this->assertSame('absent', $result['participation']);
        $this->assertNull($result['points_hundredths']);
        $this->assertSame($session->id, $result['academic_session_id']);
    }

    public function test_legacy_audit_versions_remain_accessible_and_inventory_keeps_original_records(): void
    {
        [$student, $entry, , $admin, $offer] = $this->context();
        $work = $offer->resources()->create(['kind' => 'assignment', 'title' => 'Travail historique', 'is_published' => true]);
        Storage::disk('local')->put('student-work/old.pdf', '%PDF-1.4 archive');
        $copy = AcademicSubmission::create(['academic_resource_id' => $work->id, 'academic_enrollment_id' => $entry->id, 'body' => 'Version deux', 'version' => 2]);
        Audit::record($student->id, 'academic_work_submitted', $copy, null, [
            'previous' => ['version' => 1, 'path' => 'student-work/old.pdf', 'filename' => 'archive.pdf', 'body' => 'Version un'],
        ]);
        $this->artisan('academic:assessment-audit', ['--details' => true])
            ->expectsOutputToContain("Ressource {$work->id} · Offre {$offer->id}")->assertSuccessful();
        $this->actingAs($student)->get('/dashboard/student/submissions/'.$copy->id.'/download?version=1')->assertDownload('archive.pdf');
        $this->submit($work, 2)->assertSessionHasNoErrors();
        $this->assertSame(3, $copy->fresh()->version);
        $this->get('/dashboard/student/submissions/'.$copy->id.'/versions/2')->assertInertia(fn (Assert $page) => $page->where('body', 'Version deux'));
        $this->assertNull($work->assessment()->first());

        $this->actingAs($admin)->get(route('dashboard.admin.student-academic.submissions.version', ['submission' => $copy->id, 'version' => 2]))
            ->assertInertia(fn (Assert $page) => $page->where('body', 'Version deux')->where('download_url', null));
        $this->get(route('dashboard.admin.student-academic.submissions.download', ['submission' => $copy->id, 'version' => 2]))->assertNotFound();
    }

    public function test_failed_storage_cannot_create_a_copy_or_receipt_and_cancelled_work_is_hidden(): void
    {
        [$student, $entry, $teacher, , $offer] = $this->context();
        $this->actingAs($teacher);
        $work = $this->draft($offer);
        $this->life($work, 'publish')->assertStatus(303);
        $disk = Storage::disk('local');
        $source = UploadedFile::fake()->createWithContent('copie.pdf', '%PDF-1.4 test');
        $file = \Mockery::mock(UploadedFile::class, [$source->getPathname(), 'copie.pdf', null, null, true])->makePartial();
        $file->shouldReceive('storeAs')->once()->andReturn(false);
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        try {
            app(AssessmentSubmissions::class)->submit($entry, $work, [
                'operation_key' => (string) Str::uuid(), 'expected_version' => 0,
            ], $file, $student->id);
            $this->fail('Une écriture échouée ne doit pas être confirmée.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('file', $error->errors());
        }
        $this->assertDatabaseCount('academic_submissions', 0);
        $this->assertDatabaseCount('academic_submission_versions', 0);
        $this->assertDatabaseCount('notifications', 0);
        $this->life($work, 'cancel', true)->assertStatus(303);
        $this->actingAs($student);
        $this->submit($work, 0)->assertNotFound();
        $this->assertSame('cancelled', $student->notifications()->sole()->data['status']);
        $this->get('/dashboard/student/assignments')->assertInertia(fn (Assert $page) => $page->has('resources', 0));
    }

    public function test_faculty_scope_protects_the_legacy_download_and_assistants_cannot_read_copies(): void
    {
        [$student, $entry, $teacher, $admin, $offer] = $this->context();
        $assistant = $this->teacher();
        $offer->update(['assistant_professor_id' => Professor::where('user_id', $assistant->id)->value('id')]);
        $this->actingAs($teacher);
        $work = $this->draft($offer);
        $this->life($work, 'publish')->assertStatus(303);
        $this->actingAs($student);
        $this->submit($work, 0, ['file' => UploadedFile::fake()->createWithContent('copie.pdf', '%PDF-1.4 copie')])->assertSessionHasNoErrors();
        $copy = AcademicSubmission::sole();
        $participant = AssessmentRecord::sole();
        $this->actingAs($assistant)->get(self::TEACHER.'/'.$work->id.'/records/'.$participant->id.'/copy')->assertForbidden();
        $this->get(self::TEACHER.'?resource='.$work->id)->assertForbidden();
        $foreignFaculty = DB::table('faculties')->insertGetId(['code' => 'EXT', 'name' => 'Autre faculté']);
        $admin->academicFaculties()->attach($foreignFaculty);
        $download = route('dashboard.admin.student-academic.submissions.download', ['submission' => $copy->id]);
        $version = route('dashboard.admin.student-academic.submissions.version', ['submission' => $copy->id, 'version' => 1]);
        $this->actingAs($admin)->get($download)->assertForbidden();
        $this->get($version)->assertForbidden();

        $foreignLevel = DB::table('levels')->insertGetId(['faculty_id' => $foreignFaculty, 'title' => 'Niveau externe', 'code' => 'EXT1']);
        $admin->academicFaculties()->sync([$entry->level->faculty_id]);
        $offer->update(['level_id' => $foreignLevel]);
        $this->get($download)->assertForbidden();
        $this->get($version)->assertForbidden();
    }
}
