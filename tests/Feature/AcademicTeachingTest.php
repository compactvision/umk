<?php

namespace Tests\Feature;

use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Intake;
use App\Models\LevelDetail;
use App\Models\Professor;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicUnitResult;
use App\Models\Student\AccessRule;
use App\Models\Student\CourseRegistration;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Modules\AcademicStructure\Application\Services\StructureService;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Application\Services\AcademicEnrollmentService;
use App\Modules\Teaching\Application\Services\CourseAudience;
use App\Modules\Teaching\Application\Services\CourseRegistrationService;
use App\Modules\Teaching\Application\Services\ScheduleService;
use App\Modules\Teaching\Application\Services\TeachingOfferingService;
use App\Modules\Teaching\Application\Services\TeachingTeam;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class AcademicTeachingTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private const REASON = 'Décision pédagogique validée par le responsable.';

    private function context(bool $optional = false, bool $prerequisite = false): array
    {
        $this->travelTo(Carbon::parse('2026-11-10 12:00', 'Africa/Kinshasa'));
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->firstOrFail();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $structure = app(StructureService::class);
        $common = ['revision' => 0, 'reason' => self::REASON, 'is_active' => true];
        $university = $structure->save('university', $common + ['code' => 'UNI-TEACH', 'name' => 'Université de test'], $admin);
        $entry->level->faculty->forceFill(['university_id' => $university->id])->save();
        $entry->academicYear->forceFill(['university_id' => $university->id])->save();
        $cycle = $structure->save('cycle', $common + ['code' => 'CUSTOM', 'name' => 'Cycle configurable', 'normal_duration' => 4, 'progression_mode' => 'custom', 'weighting_mode' => 'both', 'periods' => [['code' => 'P1', 'name' => 'Période personnalisée']]], $admin);
        $program = $structure->save('program', $common + ['code' => 'P-TEACH', 'name' => 'Programme pédagogique', 'faculty_id' => $entry->level->faculty_id, 'academic_cycle_id' => $cycle->id, 'level_ids' => [$entry->level_id]], $admin);
        $course = $this->subject($entry, 'TEST-EC', 'Matière du catalogue');
        $units = [[
            'level_id' => $entry->level_id, 'period_code' => 'P1', 'code' => 'UE1', 'name' => 'UE principale',
            'credit_rule' => 'independent', 'expected_credits' => '5.00',
            'items' => [['source_course_id' => $course->id, 'name' => 'EC historique', 'credits' => '3.00', 'coefficient' => '2.250', 'is_optional' => $optional]],
        ]];
        if ($prerequisite) {
            $before = $this->subject($entry, 'PREREQ', 'Initiation');
            $units[] = ['level_id' => $entry->level_id, 'period_code' => 'P1', 'code' => 'UE0', 'name' => 'UE préalable', 'items' => [['source_course_id' => $before->id, 'credits' => '2.00', 'coefficient' => '1.000']]];
        }
        $version = $this->publishVersion($admin, $entry, $program, $units);
        app(CurriculumService::class)->bind($version->id, $entry->id, $admin, self::REASON);

        return [$admin, $student, $entry->fresh(), $program, $course, $version, $version->units()->where('code', 'UE1')->sole()->items()->sole(), $units];
    }

    private function subject(AcademicEnrollment $entry, string $code, string $title): Courses
    {
        $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'code' => $code, 'title' => $title, 'credits' => 3, 'semester' => 1]);
        $course->save();

        return $course;
    }

    private function publishVersion(User $admin, AcademicEnrollment $entry, $program, array $units, string $code = 'V1', ?int $replace = null): CurriculumVersion
    {
        $service = app(CurriculumService::class);
        $v = $service->draft(['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'code' => $code, 'name' => 'Maquette '.$code, 'reason' => self::REASON], $admin);
        $v = $service->saveDraft($v->id, ['revision' => (int) $v->revision, 'reason' => self::REASON, 'units' => $units], $admin);
        $level = collect($service->levelWorkspace($v, $program))->firstWhere('id', $entry->level_id);
        $v = $service->approveLevel($v->id, $entry->level_id, $v->revision, $level['signature'], $admin);
        $v = $service->transition($v->id, 'validate', $v->revision, self::REASON, $admin);

        return $service->transition($v->id, 'publish', $v->revision, self::REASON, $admin, $replace);
    }

    private function offer(array $context, array $extra = [], bool $publish = true): AcademicOffering
    {
        [$admin, , $entry, , , , $item] = $context;
        $service = app(TeachingOfferingService::class);
        $offer = $service->create($admin, $extra + ['academic_year_id' => $entry->academic_year_id, 'curriculum_item_id' => $item->id, 'reason' => self::REASON]);
        if ($publish) {
            $this->assign($offer, $admin, $this->teacher(), 'lead');
            $service->transition($offer, $admin, 'publish', self::REASON);
        }

        return $offer->fresh();
    }

    private function teacher(): Professor
    {
        return Professor::create(['first_name' => 'Anne', 'last_name' => 'Enseignante '.Str::random(8), 'email' => Str::uuid().'@example.test', 'is_active' => true]);
    }

    private function assign(AcademicOffering $offer, User $admin, Professor $teacher, string $role, string $action = 'assign'): void
    {
        app(TeachingTeam::class)->change($offer, $admin, ['professor_id' => $teacher->id, 'role' => $role, 'action' => $action, 'reason' => self::REASON]);
    }

    private function invalid(callable $operation, string $field): void
    {
        try {
            $operation();
            $this->fail('Expected validation for '.$field);
        } catch (ValidationException $error) {
            $this->assertArrayHasKey($field, $error->errors());
        }
    }

    private function group(AcademicEnrollment $entry, $program, string $name): Classes
    {
        $promotion = AcademicPromotion::firstOrCreate(['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'level_id' => $entry->level_id], ['code' => 'PROMO', 'name' => 'Promotion']);
        $intake = Intake::create(['name' => $name, 'start_date' => '2026-10-01', 'end_date' => '2027-09-30']);
        $group = Classes::create(['level_id' => $entry->level_id, 'faculty_id' => $entry->level->faculty_id, 'intake_id' => $intake->id, 'status' => 'OPEN']);
        $group->forceFill(['academic_promotion_id' => $promotion->id])->save();

        return $group;
    }

    #[\PHPUnit\Framework\Attributes\RunInSeparateProcess]
    #[\PHPUnit\Framework\Attributes\PreserveGlobalState(false)]
    public function test_official_results_require_a_regulation_a_quorum_and_an_atomic_publication(): void
    {
        [$manager, $student, $entry, , , $version, $item] = $context = $this->context();
        $publisher = User::factory()->create();
        $secretary = User::factory()->create();
        foreach ([$publisher, $secretary] as $actor) {
            $actor->assignRole('admin');
        }
        foreach (['manage academic results', 'deliberate academic results', 'publish official results'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $manager->givePermissionTo(['manage academic results', 'deliberate academic results']);
        $publisher->givePermissionTo('publish official results');
        $secretary->givePermissionTo('deliberate academic results');
        $offer = $this->offer($context);
        app(CourseRegistrationService::class)->sync($offer, $manager, self::REASON);
        $registration = $offer->registrations()->sole();
        $assessments = [];
        foreach ([1400, 1200] as $score) {
            $resource = $offer->resources()->create(['kind' => 'evaluation', 'title' => 'Épreuve '.$score, 'is_published' => true]);
            $assessment = $resource->assessment()->create(['category' => 'exam', 'session_code' => 'ordinaire', 'modality' => 'in_person',
                'state' => 'closed', 'maximum_points' => 2000, 'attempt_limit' => 1, 'closed_at' => now()]);
            $assessment->records()->create(['academic_enrollment_id' => $entry->id, 'academic_course_registration_id' => $registration->id,
                'participation' => 'present', 'correction_state' => 'finalized', 'points' => $score]);
            app(\App\Modules\Assessment\Application\AssessmentCorrections::class)->batch($resource, $manager, ['revision' => 1, 'action' => 'validate', 'reason' => self::REASON]);
            $assessments[] = $assessment;
        }

        Storage::fake('local');
        $admin = '/dashboard/admin/academic-results';
        $rulesUrl = $admin.'/versions/'.$version->id.'/rules';
        $configuration = [
            'scale' => 2000, 'precision' => 2, 'rounding' => 'half_up', 'weighting' => 'coefficients',
            'ec_pass' => 1000, 'ue_pass' => 1000, 'compensation' => 'none', 'credit_label' => 'crédits', 'allow_equivalence' => false,
            'appeal_days' => 7, 'quorum' => 2, 'decisions' => [
                'verified' => ['label' => 'Validé sur règlement test', 'permits_incomplete' => false, 'permits_eliminatory' => false, 'progression' => 'same', 'minimum_credits' => 500],
            ],
            'items' => [$item->id => [$assessments[0]->id => 4000, $assessments[1]->id => 6000]],
        ];
        $ruleForm = ['level_id' => $entry->level_id, 'code' => 'R1', 'session_code' => 'ordinaire',
            'effective_on' => '2026-10-01', 'reference' => 'Règlement de test 2026', 'configuration' => $configuration];
        $this->actingAs($manager)->post($rulesUrl, array_replace($ruleForm, ['configuration' => array_replace($configuration, [
            'items' => [$item->id => [$assessments[0]->id => 5000]],
        ])]))->assertSessionHasErrors('configuration');
        $this->post($rulesUrl, $ruleForm)->assertStatus(303)->assertSessionHasNoErrors();
        $rule = \App\Models\Student\AcademicResultRule::sole();
        $juryForm = ['meeting_at' => '2026-11-10T11:00', 'chair' => $manager->id, 'secretary' => $secretary->id,
            'members' => [$manager->id, $secretary->id], 'reason' => self::REASON];
        $this->post($admin.'/rules/'.$rule->id.'/deliberations', $juryForm)->assertSessionHasErrors('rule');
        $this->post($admin.'/rules/'.$rule->id.'/approval', ['reason' => self::REASON])->assertForbidden();
        $this->actingAs($publisher)->post($admin.'/rules/'.$rule->id.'/approval', ['reason' => self::REASON])->assertStatus(303);
        $this->actingAs($manager)->post($admin.'/rules/'.$rule->id.'/deliberations', $juryForm)->assertStatus(303)->assertSessionHasNoErrors();
        $run = \App\Models\Student\AcademicDeliberation::sole();
        $result = $run->results()->sole();
        $this->assertSame('12.80', $result->snapshot['annual']);
        $this->assertSame(500, $result->snapshot['credits']['earned']);
        $state = $admin.'/deliberations/'.$run->id.'/state';
        $move = fn ($action, $extra = []) => $this->post($state, $extra + ['action' => $action, 'revision' => $run->fresh()->revision, 'reason' => self::REASON]);
        $studentUrl = '/dashboard/student/results?academic='.$entry->id;
        $pdf = '/dashboard/student/results/official/'.$result->reference.'/report?academic='.$entry->id;
        $this->actingAs($student)->get($studentUrl)->assertInertia(fn (Assert $page) => $page->where('official_results.selected', null));
        $this->get($pdf)->assertNotFound();
        $this->actingAs($manager);
        $move('open', ['attendance' => [$manager->id]])->assertSessionHasErrors('attendance');
        $move('open', ['attendance' => [$manager->id, $secretary->id]])->assertStatus(303)->assertSessionHasNoErrors();
        $move('approve')->assertSessionHasErrors('state');
        $this->post($admin.'/deliberations/'.$run->id.'/results/'.$result->id.'/decision', [
            'revision' => $run->fresh()->revision, 'decision' => 'verified', 'reason' => self::REASON,
        ])->assertStatus(303)->assertSessionHasNoErrors();
        $move('approve')->assertStatus(303)->assertSessionHasNoErrors();
        $move('publish')->assertForbidden();
        $this->actingAs($publisher);
        $move('publish', ['notify' => true])->assertStatus(303)->assertSessionHasNoErrors();
        $move('publish', ['revision' => 1, 'notify' => true])->assertStatus(303);
        $this->assertDatabaseCount('notifications', 1);
        $this->get($admin.'?run='.$run->id.'&result='.$result->id)->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/results/Administration')->where('run.state', 'published')->where('result.annual', '12.80'));
        $foreign = User::factory()->create();
        $foreign->assignRole('admin')->givePermissionTo('publish official results');
        $foreign->academicFaculties()->attach(DB::table('faculties')->insertGetId(['name' => 'Faculté externe', 'code' => 'EXT']));
        $this->actingAs($foreign)->get($admin.'/certified/'.$result->id)->assertForbidden();
        $this->get($admin.'?run='.$run->id)->assertNotFound();
        $this->actingAs($publisher);
        $this->get($admin.'/certified/'.$result->id)->assertOk()->assertJsonPath('snapshot.annual', '12.80')
            ->assertJsonMissingPath('snapshot.units.0.items.0.sources');
        $csv = $this->get($admin.'/deliberations/'.$run->id.'/export')->assertOk()->streamedContent();
        $this->assertStringContainsString('12.80', $csv);
        $this->get($admin.'/deliberations/'.$run->id.'/minutes')->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->actingAs($student)->get($studentUrl)->assertInertia(fn (Assert $page) => $page
            ->where('official_results.selected.annual', '12.80')->where('official_results.selected.units.0.items.0.grade', '12.80')
            ->missing('official_results.selected.units.0.items.0.sources'));
        $first = $this->get($pdf)->assertOk()->assertHeader('Content-Type', 'application/pdf')->getContent();
        $this->assertStringStartsWith('%PDF-', $first);
        $this->assertSame($first, $this->get($pdf)->assertOk()->getContent());
        $this->assertDatabaseCount('academic_result_documents', 2);
        $this->assertTrue(app(\App\Modules\Results\Application\OfficialAcquisitions::class)->profiles($item->curriculum_unit_id, collect([$entry->student_profile_id]))->contains($entry->student_profile_id));

        $nextYear = AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'draft']);
        $progressions = app(\App\Modules\Student\Application\Services\AcademicProgressionService::class);
        $destination = ['level_id' => $entry->level_id, 'academic_year_id' => $nextYear->id, 'reason' => self::REASON];
        $this->invalid(fn () => $progressions->decide($entry, $manager, $destination), 'level_id');
        $progressions->decide($entry, $manager, $destination + ['academic_official_result_id' => $result->id]);
        $progression = \App\Models\Student\AcademicProgression::sole();
        $this->assertSame($result->id, $progression->academic_official_result_id);
        $this->assertNull($progression->target_enrollment_id);

        $appealUrl = '/dashboard/student/results/official/'.$result->reference.'/appeal?academic='.$entry->id;
        $this->post($appealUrl, ['target' => 'ec:'.$item->id, 'body' => 'Demande de vérification du report.'])->assertStatus(303)->assertSessionHasNoErrors();
        $this->post($appealUrl, ['target' => 'ec:'.$item->id, 'body' => 'Demande de vérification du report.'])->assertStatus(303);
        $appeal = \App\Models\Student\ServiceRequest::sole();
        $this->travel(8)->days();
        $this->post($appealUrl, ['target' => 'decision', 'body' => 'Demande après la date autorisée.'])->assertSessionHasErrors('target');
        $this->actingAs($manager);
        foreach (['review', 'admit', 'investigate'] as $action) {
            $this->post($admin.'/appeals/'.$appeal->id, ['action' => $action, 'revision' => $appeal->fresh()->result_revision, 'assigned_to' => $manager->id,
                'reason' => self::REASON])->assertStatus(303)->assertSessionHasNoErrors();
        }
        $this->actingAs($publisher)->post($admin.'/appeals/'.$appeal->id, ['action' => 'accept', 'revision' => $appeal->fresh()->result_revision,
            'reason' => self::REASON])->assertStatus(303)->assertSessionHasNoErrors();
        $this->assertSame('accepted', $appeal->fresh()->status);
        $source = $assessments[0]->records()->sole();
        $assessmentCorrections = app(\App\Modules\Assessment\Application\AssessmentCorrections::class);
        $assessmentCorrections->record($assessments[0]->resource, $manager, $source, [
            'action' => 'reopen', 'revision' => $source->revision, 'reason' => self::REASON,
        ]);
        $assessmentCorrections->save($assessments[0]->resource, $manager, $source, [
            'participation' => 'present', 'points' => '15', 'revision' => $source->fresh()->revision, 'reason' => self::REASON,
        ], null);
        $assessmentCorrections->record($assessments[0]->resource, $manager, $source, [
            'action' => 'finalize', 'revision' => $source->fresh()->revision, 'reason' => self::REASON,
        ]);
        $assessmentCorrections->batch($assessments[0]->resource, $manager, [
            'action' => 'validate', 'revision' => $assessments[0]->fresh()->revision, 'reason' => self::REASON,
        ]);
        $this->actingAs($manager)->post($admin.'/rules/'.$rule->id.'/deliberations', $juryForm + ['previous_id' => $run->id, 'appeal_id' => $appeal->id])
            ->assertStatus(303)->assertSessionHasNoErrors();
        $this->assertSame('published', $run->fresh()->state);
        $this->assertDatabaseCount('academic_deliberations', 2);
        $replacement = \App\Models\Student\AcademicDeliberation::latest('id')->firstOrFail();
        $revised = $replacement->results()->sole();
        $this->assertSame('13.20', $revised->snapshot['annual']);
        $this->assertSame('12.80', $result->fresh()->snapshot['annual']);
        $revisedUrl = $admin.'/deliberations/'.$replacement->id;
        $this->post($revisedUrl.'/state', ['action' => 'open', 'revision' => $replacement->revision,
            'attendance' => [$manager->id, $secretary->id], 'reason' => self::REASON])->assertStatus(303)->assertSessionHasNoErrors();
        $this->post($revisedUrl.'/results/'.$revised->id.'/decision', ['decision' => 'verified', 'revision' => $replacement->fresh()->revision,
            'reason' => self::REASON])->assertStatus(303)->assertSessionHasNoErrors();
        $this->post($revisedUrl.'/state', ['action' => 'approve', 'revision' => $replacement->fresh()->revision,
            'reason' => self::REASON])->assertStatus(303)->assertSessionHasNoErrors();
        $this->actingAs($publisher)->post($revisedUrl.'/state', ['action' => 'publish', 'revision' => $replacement->fresh()->revision,
            'reason' => self::REASON])->assertStatus(303)->assertSessionHasNoErrors();
        $this->actingAs($student)->get($studentUrl)->assertInertia(fn (Assert $page) => $page
            ->where('official_results.selected.annual', '13.20')->has('official_results.items.data', 2));
        $this->invalid(fn () => $progressions->start($progression, $student->studentProfile), 'progression');
        $progressions->decide($entry, $manager, $destination + ['academic_official_result_id' => $revised->id]);
        $this->assertSame($revised->id, $progression->fresh()->academic_official_result_id);
        $this->assertNull($progression->fresh()->target_enrollment_id);
        $this->assertSame($first, $this->actingAs($student)->get($pdf)->assertOk()->getContent());
    }

    public function test_catalog_codes_are_unique_and_archive_preserves_published_references(): void
    {
        [$admin, $student, $entry, , $course, , $item] = $ctx = $this->context();
        $offer = $this->offer($ctx);
        LevelDetail::create(['level_id' => $entry->level_id, 'credit_required' => 60]);
        $data = ['faculty_id' => $entry->level->faculty_id, 'level_id' => $entry->level_id, 'title' => 'Autre cours', 'code' => ' test-ec ', 'credits' => 2, 'semester' => 1];
        $this->actingAs($admin)->post('/dashboard/admin/course-catalog', $data)->assertSessionHasErrors('code');
        $this->put('/dashboard/admin/course-catalog/'.$course->id, ['title' => 'Nom courant', 'code' => 'NOUVEAU', 'credits' => 4, 'semester' => 1, 'reason' => self::REASON])->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/course-catalog/'.$course->id.'/status', ['status' => 'archived', 'reason' => self::REASON])->assertStatus(303);
        $this->get('/dashboard/admin/course-catalog/'.$course->id)->assertInertia(fn (Assert $page) => $page->component('dashboard/courseCatalog/Show')->where('course.catalog_status', 'archived')->where('uses.data.0.title', 'EC historique'));
        $this->invalid(fn () => $course->fresh()->delete(), 'course');
        app(CourseRegistrationService::class)->sync($offer, $admin, self::REASON);
        $this->actingAs($student)->get('/dashboard/student/courses/'.$course->id.'?academic='.$entry->id)->assertInertia(fn (Assert $page) => $page
            ->where('course.title', 'EC historique')->where('course.curriculum_item_id', $item->id)->where('course.credits', 3)->where('registered', true));
    }

    public function test_optional_item_and_independent_ue_credits_are_frozen_and_duplicate_codes_are_refused(): void
    {
        [$admin, , $entry, $program, $course, $version, $item, $units] = $this->context(true);
        $this->assertTrue($item->is_optional);
        $this->assertSame('5.00', $item->unit->expected_credits);
        $this->assertSame('3.00', $item->credits);
        $this->invalid(fn () => $item->update(['is_optional' => false]), 'items');
        $this->invalid(fn () => $item->unit->update(['credit_rule' => 'sum']), 'units');
        $draft = app(CurriculumService::class)->draft(['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'code' => 'DUP', 'name' => 'Contrôle des codes', 'reason' => self::REASON], $admin);
        $other = $this->subject($entry, 'test-ec', 'Doublon historique de référence');
        $units[0]['items'][] = ['source_course_id' => $other->id, 'credits' => 3, 'coefficient' => 1];
        $this->invalid(fn () => app(CurriculumService::class)->saveDraft($draft->id, ['revision' => 0, 'units' => $units, 'reason' => self::REASON], $admin), 'units');
        $this->assertSame('published', $version->fresh()->status);
    }

    public function test_offering_creation_is_idempotent_and_refuses_the_wrong_period_and_group(): void
    {
        [$admin, , $entry, $program, , $version, $item] = $ctx = $this->context();
        $semester = AcademicSemester::create(['academic_year_id' => $entry->academic_year_id, 'number' => 2, 'start_date' => '2027-03-01', 'end_date' => '2027-09-30']);
        $group = $this->group($entry, $program, 'A');
        $base = ['academic_year_id' => $entry->academic_year_id, 'curriculum_item_id' => $item->id, 'class_id' => $group->id, 'academic_semester_id' => $semester->id, 'reason' => self::REASON];
        $this->actingAs($admin)->post('/dashboard/admin/teaching', $base)->assertStatus(303);
        $offer = AcademicOffering::sole();
        $this->post('/dashboard/admin/teaching', $base)->assertStatus(303);
        $this->assertDatabaseCount('academic_offerings', 1);
        $this->assertSame($semester->id, $offer->academic_semester_id);
        $this->assertSame($group->id, $offer->class_id);
        $this->get('/dashboard/admin/teaching?offering='.$offer->id)->assertInertia(fn (Assert $p) => $p->component('dashboard/teaching/Index')->where('selected.unit', 'UE principale')->where('selected.status', 'draft'));
        $this->get('/dashboard/admin/teaching?year='.$entry->academic_year_id.'&program='.$program->id.'&version='.$version->id)
            ->assertInertia(fn (Assert $p) => $p->where('items.0.id', $item->id)->where('groups.0.id', $group->id)->where('semesters.0.id', $semester->id));
        $this->post('/dashboard/admin/teaching/'.$offer->id.'/status', ['action' => 'publish', 'reason' => self::REASON])->assertSessionHasErrors('offering');
        $wrong = AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'draft']);
        $this->post('/dashboard/admin/teaching', array_replace($base, ['academic_year_id' => $wrong->id]))->assertSessionHasErrors('academic_semester_id');
        $this->invalid(fn () => $offer->update(['class_id' => null]), 'offering');
        $this->assign($offer, $admin, $this->teacher(), 'lead');
        $this->post('/dashboard/admin/teaching/'.$offer->id.'/status', ['action' => 'publish', 'reason' => self::REASON])->assertStatus(303);
        $this->assertTrue($offer->fresh()->is_published);
    }

    public function test_managed_resources_require_explicit_registration_and_stay_private_after_withdrawal(): void
    {
        [$admin, $student, $entry, , $course] = $ctx = $this->context();
        $offer = $this->offer($ctx);
        Storage::fake('local');
        Storage::disk('local')->put('academic-resources/teaching-test.pdf', 'private course bytes');
        $resource = $offer->resources()->create(['kind' => 'material', 'title' => 'Support privé', 'path' => 'academic-resources/teaching-test.pdf', 'filename' => 'teaching-test.pdf', 'is_published' => true]);
        $courseUrl = '/dashboard/student/courses/'.$course->id.'?academic='.$entry->id;
        $download = '/dashboard/student/resources/'.$resource->id.'/download?academic='.$entry->id;
        $this->actingAs($student)->get($courseUrl)->assertNotFound();
        $this->get($download)->assertNotFound();
        $this->post('/dashboard/admin/teaching/'.$offer->id.'/sync', ['reason' => self::REASON])->assertForbidden();
        $this->actingAs($admin)->post('/dashboard/admin/teaching/'.$offer->id.'/sync', ['reason' => self::REASON])->assertStatus(303);
        $this->post('/dashboard/admin/teaching/'.$offer->id.'/sync', ['reason' => self::REASON])->assertStatus(303);
        $this->assertDatabaseCount('academic_course_registrations', 1);
        $this->actingAs($student)->get($courseUrl)->assertOk();
        $this->get($download)->assertForbidden();
        AccessRule::create(['academic_year_id' => $entry->academic_year_id, 'feature' => 'materials_download', 'mode' => 'open', 'is_active' => true]);
        $this->get($download)->assertDownload('teaching-test.pdf');
        AccessRule::create(['academic_year_id' => $entry->academic_year_id, 'feature' => 'assignments_submit', 'mode' => 'open', 'is_active' => true]);
        $assignment = $offer->resources()->create(['kind' => 'assignment', 'title' => 'Travail privé', 'is_published' => true]);
        $submit = '/dashboard/student/resources/'.$assignment->id.'/submit?academic='.$entry->id;
        $this->post($submit, ['body' => 'Première version privée.'])->assertSessionHasNoErrors();
        $this->post($submit, ['body' => 'Version suivante privée.'])->assertSessionHasNoErrors();
        $registration = CourseRegistration::sole();
        $this->actingAs($admin)->post('/dashboard/admin/teaching/registrations/'.$registration->id.'/withdraw', ['reason' => self::REASON])->assertStatus(303);
        $this->post('/dashboard/admin/teaching/'.$offer->id.'/sync', ['reason' => self::REASON])->assertStatus(303);
        $this->assertDatabaseCount('academic_course_registrations', 1);
        $this->assertNotNull($registration->fresh()->withdrawn_at);
        $this->actingAs($student)->get($download)->assertNotFound();
        $this->post($submit, ['body' => 'Tentative après retrait.'])->assertNotFound();
        $this->assertDatabaseHas('academic_submissions', ['academic_enrollment_id' => $entry->id, 'academic_resource_id' => $assignment->id, 'version' => 2]);
        $this->assertDatabaseHas('academic_resources', ['id' => $resource->id]);
    }

    public function test_learning_library_filters_versioned_programs_within_the_staff_faculty(): void
    {
        [$admin, $student, $entry, $program, $course] = $context = $this->context();
        $offer = $this->offer($context);
        $library = '/dashboard/admin/teaching/resources';
        $this->actingAs($admin)->post($library.'/offerings/'.$offer->id, [
            'operation_key' => (string) Str::uuid(), 'title' => 'Lien de la maquette', 'kind' => 'online', 'url' => 'https://example.test/lecture',
        ])->assertStatus(303);
        $resource = $offer->resources()->sole();
        $this->post($library.'/'.$resource->id.'/publication', ['action' => 'publish', 'reason' => self::REASON, 'revision' => 1])->assertStatus(303);
        $this->get($library.'?program='.$program->id)->assertInertia(fn (Assert $page) => $page
            ->has('offers.data', 1)->where('offers.data.0.id', $offer->id)->has('resources.data', 1));
        $this->get($library.'?program='.($program->id + 1))->assertInertia(fn (Assert $page) => $page->has('offers.data', 0)->has('resources.data', 0));

        $outside = User::factory()->create();
        $outside->assignRole('admin');
        $outside->academicFaculties()->attach(DB::table('faculties')->insertGetId(['name' => 'Faculté externe', 'code' => 'EXT']));
        $this->actingAs($outside)->get($library.'?program='.$program->id)->assertInertia(fn (Assert $page) => $page->has('resources.data', 0));
        $this->get($library.'?resource='.$resource->id)->assertForbidden();

        $courseUrl = '/dashboard/student/courses/'.$course->id.'/online';
        $this->actingAs($student)->get($courseUrl)->assertNotFound();
        app(CourseRegistrationService::class)->sync($offer, $admin, self::REASON);
        $this->get($courseUrl)->assertInertia(fn (Assert $page) => $page
            ->where('course.title', 'EC historique')->has('resources', 1)->where('resources.0.id', $resource->id));
        $this->assertSame($entry->curriculum_version_id, $student->studentProfile->enrollments()->sole()->curriculum_version_id);
    }

    public function test_optional_course_prerequisite_uses_official_unit_results_or_explicit_derogation(): void
    {
        [$admin, $student, $entry, , $course, $version] = $ctx = $this->context(true, true);
        $unit = $version->units()->where('code', 'UE0')->sole();
        $offer = $this->offer($ctx, ['required_unit_id' => $unit->id]);
        $service = app(CourseRegistrationService::class);
        $this->invalid(fn () => $service->sync($offer, $admin, self::REASON), 'offering');
        $this->invalid(fn () => $service->register($offer, $entry, $admin, 'elective', self::REASON), 'academic_enrollment_id');
        $override = $service->register($offer, $entry, $admin, 'derogation', self::REASON);
        $service->withdraw($override, $admin, self::REASON);
        AcademicUnitResult::create(['academic_enrollment_id' => $entry->id, 'curriculum_unit_id' => $unit->id, 'score' => 14, 'validated' => true]);
        $repeat = $service->register($offer, $entry, $admin, 'repeat', self::REASON);
        $this->assertSame('repeat', $repeat->mode);
        $this->assertSame($repeat->id, $service->register($offer, $entry, $admin, 'repeat', self::REASON)->id);
        $this->assertDatabaseCount('academic_unit_results', 1);
        $this->assertDatabaseCount('academic_course_registrations', 2);
        $this->actingAs($student)->get('/dashboard/student/courses/'.$course->id)->assertOk();
    }

    public function test_other_version_of_same_course_does_not_grant_access_or_inherit_registration(): void
    {
        [$admin, $student, $entry, $program, $course, $version, , $units] = $ctx = $this->context();
        $old = $this->offer($ctx);
        $service = app(CourseRegistrationService::class);
        $service->sync($old, $admin, self::REASON);
        $units[0]['items'][0]['name'] = 'EC nouvelle cohorte';
        $new = $this->publishVersion($admin, $entry, $program, $units, 'V2', $version->id);
        $newItem = $new->units()->sole()->items()->sole();
        $newOffer = $this->offer($ctx, ['curriculum_item_id' => $newItem->id]);
        $this->invalid(fn () => $service->register($newOffer, $entry, $admin, 'mandatory', self::REASON), 'academic_enrollment_id');
        $this->assertSame([$old->id], app(AcademicAccessService::class)->offerings($entry->fresh())->pluck('id')->all());
        $this->actingAs($student)->get('/dashboard/student/courses/'.$course->id)->assertInertia(fn (Assert $page) => $page->where('course.title', 'EC historique')->where('organization.0.id', $old->id));
    }

    public function test_group_change_closes_old_registration_and_keeps_past_session_history(): void
    {
        [$admin, , $entry, $program] = $ctx = $this->context();
        $a = $this->group($entry, $program, 'A');
        $b = $this->group($entry, $program, 'B');
        $entry->update(['class_id' => $a->id]);
        $old = $this->offer($ctx, ['class_id' => $a->id]);
        $new = $this->offer($ctx, ['class_id' => $b->id]);
        $service = app(CourseRegistrationService::class);
        $service->sync($old, $admin, self::REASON);
        $this->invalid(fn () => $service->register($new, $entry, $admin, 'mandatory', self::REASON), 'academic_enrollment_id');
        $this->travel(2)->hours();
        $past = $old->sessions()->create(['starts_at' => now()->subHour()->utc(), 'ends_at' => now()->utc(), 'is_published' => true, 'room' => 'A']);
        $future = $old->sessions()->create(['starts_at' => now()->addDays(2)->utc(), 'ends_at' => now()->addDays(2)->addHour()->utc(), 'is_published' => true, 'room' => 'A']);
        app(AcademicEnrollmentService::class)->transition($entry, $admin, ['operation_key' => (string) Str::uuid(), 'enrollment_status' => 'confirmed', 'class_id' => $b->id, 'reason' => self::REASON]);
        $this->assertNotNull(CourseRegistration::where('academic_offering_id', $old->id)->sole()->withdrawn_at);
        $this->assertSame(1, $service->sync($new, $admin, self::REASON)['registered']);
        $access = app(AcademicAccessService::class);
        $this->assertSame([$new->id], $access->offerings($entry->fresh())->pluck('id')->all());
        $this->assertTrue($access->sessions($entry->fresh())->whereKey($past->id)->exists());
        $this->assertFalse($access->sessions($entry->fresh())->whereKey($future->id)->exists());
        $this->assertTrue(app(CourseAudience::class)->roster($old, $past->starts_at)->whereKey($entry->id)->exists());
        $this->assertFalse(app(CourseAudience::class)->roster($old, $future->starts_at)->whereKey($entry->id)->exists());
    }

    public function test_team_history_keeps_original_teacher_and_assistants_block_overlapping_sessions(): void
    {
        [$admin, , $entry, $program] = $ctx = $this->context();
        $a = $this->offer($ctx, ['class_id' => $this->group($entry, $program, 'A')->id]);
        $b = $this->offer($ctx, ['class_id' => $this->group($entry, $program, 'B')->id]);
        $assistant = $this->teacher();
        $this->assign($a, $admin, $assistant, 'assistant');
        $this->assign($b, $admin, $assistant, 'assistant');
        $s = app(ScheduleService::class);
        $s->save(['academic_offering_id' => $a->id, 'starts_at' => '2026-11-14T08:00', 'ends_at' => '2026-11-14T10:00', 'room' => 'A'], $admin->id);
        $this->invalid(fn () => $s->save(['academic_offering_id' => $b->id, 'starts_at' => '2026-11-14T08:00', 'ends_at' => '2026-11-14T10:00', 'room' => 'B'], $admin->id), 'starts_at');
        $original = $a->professor;
        $replacement = $this->teacher();
        $this->travel(2)->days();
        $this->assign($a, $admin, $replacement, 'lead');
        $this->assertSame($original->full_name, TeachingTeam::leadNameAt($a->fresh(), now()->subDay()));
        $this->assertSame($replacement->full_name, TeachingTeam::leadNameAt($a->fresh(), now()->addDay()));
        $this->assertDatabaseCount('academic_sessions', 1);
        $this->assertSame(2, $a->assignments()->where('role', 'lead')->count());
        $this->assertNotNull($a->assignments()->where('professor_id', $original->id)->sole()->ends_at);
    }

    public function test_teacher_workspace_is_scoped_and_assistant_cannot_publish_or_see_roster(): void
    {
        [$admin, , $entry, $program] = $ctx = $this->context();
        $a = $this->offer($ctx, ['class_id' => $this->group($entry, $program, 'A')->id]);
        $b = $this->offer($ctx, ['class_id' => $this->group($entry, $program, 'B')->id]);
        $lead = User::factory()->create();
        $lead->assignRole(Role::findOrCreate('professor', 'web'));
        foreach (['manage courses', 'manage students'] as $permission) {
            $lead->givePermissionTo(Permission::findOrCreate($permission, 'web'));
        }
        $helper = User::factory()->create();
        $helper->assignRole('professor');
        $helper->givePermissionTo(['manage courses', 'manage students']);
        $assistant = $this->teacher();
        $this->assign($a, $admin, $assistant, 'assistant');
        $this->actingAs($admin)->post('/dashboard/admin/professors/'.$a->professor_id.'/account', ['email' => $lead->email, 'reason' => self::REASON])->assertForbidden();
        $admin->givePermissionTo(Permission::findOrCreate('manage users', 'web'));
        $this->post('/dashboard/admin/professors/'.$a->professor_id.'/account', ['email' => $lead->email, 'reason' => self::REASON])->assertStatus(303);
        $this->post('/dashboard/admin/professors/'.$assistant->id.'/account', ['email' => $helper->email, 'reason' => self::REASON])->assertStatus(303);
        Professor::whereKey([$a->professor_id, $assistant->id])->update(['photo' => 'professors/test-portrait.png']);
        $this->actingAs($lead)->get('/dashboard/teacher?offering='.$a->id)->assertInertia(fn (Assert $p) => $p->component('dashboard/teaching/Teacher')->has('offerings.data', 1)->where('selected.id', $a->id)->where('canPublish', true)->has('students'));
        $this->get('/dashboard/teacher?offering='.$b->id)->assertNotFound();
        $this->post('/dashboard/teacher/'.$a->id.'/links', ['title' => 'Support validé', 'url' => 'https://example.test/support'])->assertStatus(303);
        $this->actingAs($helper)->get('/dashboard/teacher?offering='.$a->id)->assertInertia(fn (Assert $p) => $p->where('students', null)->where('canPublish', false));
        $this->post('/dashboard/teacher/'.$a->id.'/links', ['title' => 'Interdit', 'url' => 'https://example.test/interdit'])->assertForbidden();
        $this->assertDatabaseCount('academic_resources', 1);
    }

    public function test_archive_preserves_activities_and_scoped_staff_cannot_mutate_other_faculty(): void
    {
        [$admin, , $entry] = $ctx = $this->context();
        $offer = $this->offer($ctx);
        $offer->resources()->create(['kind' => 'material', 'title' => 'Historique', 'is_published' => true]);
        app(CourseRegistrationService::class)->sync($offer, $admin, self::REASON);
        $outsider = User::factory()->create();
        $outsider->assignRole('admin');
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Autre faculté', 'code' => 'AUTRE']);
        $outsider->academicFaculties()->attach($faculty);
        $this->actingAs($outsider)->post('/dashboard/admin/teaching/'.$offer->id.'/status', ['action' => 'archive', 'reason' => self::REASON])->assertForbidden();
        $this->get('/dashboard/admin/teaching?offering='.$offer->id)->assertNotFound();
        $this->actingAs($admin)->post('/dashboard/admin/teaching/'.$offer->id.'/status', ['action' => 'archive', 'reason' => self::REASON])->assertStatus(303);
        $this->assertNotNull($offer->fresh()->archived_at);
        $this->assertDatabaseCount('academic_resources', 1);
        $this->assertDatabaseCount('academic_course_registrations', 1);
        $this->invalid(fn () => app(CourseRegistrationService::class)->sync($offer, $admin, self::REASON), 'offering');
        $this->invalid(fn () => $offer->delete(), 'offering');
        $this->assertSame([$offer->id], app(AcademicAccessService::class)->offerings($entry)->pluck('id')->all());
    }

    public function test_legacy_audit_reports_ambiguity_without_rewriting_any_offering(): void
    {
        [$admin, , $entry, $program, $course, $version, , $units] = $ctx = $this->context();
        $legacy = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id, 'is_published' => true]);
        $this->publishVersion($admin, $entry, $program, $units, 'V2', $version->id);
        $before = $legacy->fresh()->getAttributes();
        $this->artisan('academic:teaching-audit', ['--year' => (string) $entry->academic_year_id, '--details' => true])->expectsOutputToContain('ambigu: 1')->assertSuccessful();
        $this->assertSame($before, $legacy->fresh()->getAttributes());
        $this->invalid(fn () => $this->offer($ctx, ['curriculum_item_id' => CurriculumVersion::where('code', 'V2')->sole()->units()->sole()->items()->sole()->id], false), 'curriculum_item_id');
    }
}
