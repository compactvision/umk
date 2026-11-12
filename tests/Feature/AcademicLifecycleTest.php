<?php

namespace Tests\Feature;

use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Level;
use App\Models\Student\AcademicDeliberation;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicLifecycleCase;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\AcademicProgression;
use App\Models\Student\AcademicResultRule;
use App\Models\User;
use App\Modules\Progression\Application\AcademicLifecycle;
use App\Modules\Progression\Application\GraduationEvidence;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Teaching\Application\Services\CourseAudience;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

final class AcademicLifecycleTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private const REASON = 'Décision documentée par la scolarité.';

    private const PREFIX = 'dashboard.admin.progression.';

    public function test_graduation_requires_a_certified_curriculum_and_separate_authority(): void
    {
        [$student, $entry, $program, $manager, $approver] = $this->context();
        $version = $this->version($entry, $program, $entry->academicYear, 'SOURCE');
        $entry->forceFill(['curriculum_version_id' => $version->id])->save();
        $proposal = route(self::PREFIX.'propose', $entry);
        $payload = ['kind' => 'graduation', 'reason' => self::REASON, 'operation_key' => (string) Str::uuid()];
        $this->actingAs($manager)->postJson($proposal, $payload)->assertUnprocessable()->assertJsonValidationErrors('graduation');
        $this->postJson(route('dashboard.admin.student-academic.status', $entry), [
            'student_status' => 'graduated', 'enrollment_status' => 'confirmed', 'reason' => self::REASON,
        ])->assertUnprocessable()->assertJsonValidationErrors('student_status');
        $result = $this->publishedResult($entry, $version, $approver, [
            'progression' => 'none', 'completion_credits' => 300, 'completion_evidence' => 'Validation de soutenance',
        ], true);
        $this->postJson($proposal, $payload)->assertUnprocessable()->assertJsonValidationErrors('evidence');
        $payload['evidence'] = 'Procès-verbal de soutenance TEST-31';
        $this->post($proposal, $payload)->assertStatus(303);
        $this->post($proposal, $payload)->assertStatus(303);
        $case = AcademicLifecycleCase::sole();
        $review = route(self::PREFIX.'decide', $case);
        $decision = ['action' => 'approve', 'revision' => 1, 'reason' => self::REASON];
        $this->post($review, $decision)->assertForbidden();
        $this->actingAs($approver)->post($review, $decision)->assertStatus(303);
        $this->post($review, $decision)->assertStatus(303);
        $this->assertSame('approved', $case->fresh()->status);
        $this->assertSame('completed', $entry->fresh()->enrollment_status);
        $this->assertSame('graduated', $student->studentProfile()->sole()->student_status);
        $this->assertSame(300, $case->fresh()->context['completion']['credits']);
        $this->assertSame($case->id, app(GraduationEvidence::class)->approved($entry->fresh(), $result)?->id);
        $this->assertDatabaseCount('official_documents', 0);
        $this->get(route(self::PREFIX.'index', ['academic' => $entry->id]))->assertInertia(fn (Assert $page) => $page->component('dashboard/studentAcademic/Progression')->where('cases.data.0.completion.credits', 300));
        $this->actingAs($student)->get(route('dashboard.student.index', ['section' => 'academics', 'academic' => $entry->id]))
            ->assertInertia(fn (Assert $page) => $page->where('lifecycle.0.kind', 'graduation')->where('lifecycle.0.status', 'approved'));
    }

    public function test_conditional_progression_preserves_result_and_creates_only_pending_enrollment(): void
    {
        $this->travelTo(now()->setDate(2027, 11, 10));
        [$student, $entry, $program, $manager, $approver, $next] = $this->context(twoLevels: true);
        $sourceVersion = $this->version($entry, $program, $entry->academicYear, 'SOURCE');
        $entry->forceFill(['curriculum_version_id' => $sourceVersion->id])->save();
        $year = $this->nextYear();
        $targetVersion = $this->version($entry, $program, $year, 'TARGET');
        $data = ['level_id' => $next->id, 'academic_year_id' => $year->id, 'target_curriculum_version_id' => $targetVersion->id, 'reason' => self::REASON];
        $endpoint = route('dashboard.admin.student-academic.progression', $entry);
        $this->actingAs($manager)->postJson($endpoint, $data)->assertUnprocessable()->assertJsonValidationErrors('level_id');
        $result = $this->publishedResult($entry, $sourceVersion, $approver, ['progression' => 'conditional', 'retake' => 'unacquired_units'], false);
        $data['academic_official_result_id'] = $result->id;
        $this->postJson($endpoint, $data)->assertUnprocessable()->assertJsonValidationErrors('due_on');
        $this->post($endpoint, $data + ['due_on' => '2028-05-01'])->assertStatus(303);
        $this->post($endpoint, $data + ['due_on' => '2028-05-01'])->assertStatus(303);
        $plan = AcademicProgression::sole();
        $this->assertSame('conditional', $plan->kind);
        $this->assertSame('failed', $plan->decision_snapshot['retakes'][0]['initial_status']);
        $this->assertNull($plan->target_enrollment_id);
        $this->assertDatabaseCount('academic_enrollments', 1);
        $this->actingAs($student)->post(route('dashboard.student.renewals.start', ['progression' => $plan->id, 'academic' => $entry->id]))->assertRedirect();
        $target = $plan->fresh()->target;
        $this->assertNotNull($target);
        $this->assertSame($entry->matricule, $target->matricule);
        $this->assertSame('pending_confirmation', $target->enrollment_status);
        $this->assertSame($targetVersion->id, $target->curriculum_version_id);
        $this->assertSame($sourceVersion->id, $entry->fresh()->curriculum_version_id);
        $this->assertSame(0, $result->fresh()->snapshot['credits']['earned']);
        $this->assertDatabaseCount('academic_course_registrations', 0);

        $newItem = $targetVersion->units()->where('level_id', $entry->level_id)->sole()->items()->sole();
        $offering = AcademicOffering::create([
            'level_id' => $entry->level_id, 'course_id' => $newItem->source_course_id, 'curriculum_item_id' => $newItem->id,
            'academic_year_id' => $year->id, 'is_published' => true, 'is_optional' => false, 'semester' => 'P',
        ]);
        $retake = route(self::PREFIX.'retake', $plan);
        $assignment = ['offering_id' => $offering->id, 'item_id' => $plan->decision_snapshot['retakes'][0]['item_id'], 'reason' => self::REASON];
        $this->actingAs($manager)->postJson($retake, $assignment)->assertUnprocessable();
        config(['student.enrollment_requires_first_installment' => false]);
        $this->post(route('dashboard.admin.student-academic.status', $target), [
            'enrollment_status' => 'confirmed', 'student_status' => 'active', 'reason' => self::REASON,
        ])->assertStatus(303);
        $this->post($retake, $assignment)->assertStatus(303);
        $this->post($retake, $assignment)->assertStatus(303);
        $this->assertDatabaseCount('academic_course_registrations', 1);
        $this->assertDatabaseCount('academic_retake_assignments', 1);
        $this->assertTrue(app(CourseAudience::class)->roster($offering)->whereKey($target->id)->exists());
        $this->assertTrue(app(AcademicAccessService::class)->offerings($target->fresh())->whereKey($offering->id)->exists());
        $this->actingAs($student)->get(route('dashboard.student.courses.show', ['course' => $newItem->source_course_id, 'academic' => $target->id]))
            ->assertInertia(fn (Assert $page) => $page->where('course.curriculum_item_id', $newItem->id));
    }

    public function test_interruption_resumption_and_scope_follow_the_same_student(): void
    {
        [$student, $entry, $program, $manager, $approver] = $this->context();
        $sourceVersion = $this->version($entry, $program, $entry->academicYear, 'SOURCE');
        $entry->forceFill(['curriculum_version_id' => $sourceVersion->id])->save();
        $year = $this->nextYear();
        $version = $this->version($entry, $program, $year, 'TARGET');
        $propose = route(self::PREFIX.'propose', $entry);
        $payload = ['kind' => 'interruption', 'operation_key' => (string) Str::uuid(), 'reason' => self::REASON];
        $this->actingAs($student)->post($propose, $payload)->assertForbidden();
        $this->actingAs($manager)->post($propose, $payload)->assertStatus(303);
        $case = AcademicLifecycleCase::sole();
        $other = $entry->level->faculty->university->faculties()->create(['name' => 'Autre faculté', 'code' => 'OTHER']);
        $outsider = $this->staff([AcademicLifecycle::APPROVE]);
        $outsider->academicFaculties()->attach($other->id);
        $decision = ['action' => 'approve', 'revision' => 1, 'reason' => self::REASON];
        $review = route(self::PREFIX.'decide', $case);
        $this->actingAs($outsider)->post($review, $decision)->assertForbidden();
        $this->actingAs($approver)->post($review, array_replace($decision, ['action' => 'correct']))->assertStatus(303);
        $this->assertSame('correction', $case->fresh()->status);
        $revision = ['revision' => 2, 'reason' => 'Motif corrigé et documenté par la scolarité.'];
        $revise = route(self::PREFIX.'revise', $case);
        $this->post($revise, $revision)->assertForbidden();
        $this->actingAs($manager)->post($revise, $revision)->assertStatus(303);
        $this->post($revise, $revision)->assertStatus(303);
        $this->actingAs($approver)->postJson($review, $decision)->assertUnprocessable();
        $this->post($review, array_replace($decision, ['revision' => 3]))->assertStatus(303);
        $this->assertTrue(AcademicLifecycle::interrupted($entry));
        $this->assertSame('confirmed', $entry->fresh()->enrollment_status);
        $this->actingAs($manager)->post($propose, [
            'kind' => 'resumption', 'operation_key' => (string) Str::uuid(), 'reason' => self::REASON, 'year_id' => $year->id, 'version_id' => $version->id,
        ])->assertStatus(303);
        $resume = AcademicLifecycleCase::where('kind', 'resumption')->sole();
        $this->actingAs($approver)->post(route(self::PREFIX.'decide', $resume), $decision)->assertStatus(303);
        $this->assertFalse(AcademicLifecycle::interrupted($entry));
        $plan = AcademicProgression::sole();
        $this->actingAs($student)->post(route('dashboard.student.renewals.start', ['progression' => $plan->id, 'academic' => $entry->id]))->assertRedirect();
        $this->assertSame('pending_confirmation', $plan->fresh()->target?->enrollment_status);
        $this->assertDatabaseCount('student_profiles', 1);
    }

    public function test_completion_counts_certified_prior_credits_only_when_the_rule_allows_alignment(): void
    {
        [$student, $entry, $program, $manager, $approver, $next] = $this->context(twoLevels: true);
        $version = $this->version($entry, $program, $entry->academicYear, 'SOURCE');
        $entry->forceFill(['curriculum_version_id' => $version->id, 'enrollment_status' => 'completed'])->save();
        $this->publishedResult($entry, $version, $approver, ['progression' => 'next'], true);
        $year = $this->nextYear();
        $targetVersion = $this->version($entry, $program, $year, 'FINAL');
        $target = $student->studentProfile->enrollments()->create([
            'level_id' => $next->id, 'academic_year_id' => $year->id, 'application_id' => $entry->application_id,
            'enrollment_status' => 'confirmed', 'currency' => 'USD', 'matricule' => $entry->matricule,
        ]);
        $target->forceFill(['curriculum_version_id' => $targetVersion->id])->save();
        $this->publishedResult($target, $targetVersion, $approver, ['progression' => 'none', 'completion_credits' => 600], true);
        $url = route(self::PREFIX.'propose', $target);
        $payload = ['kind' => 'graduation', 'operation_key' => (string) Str::uuid(), 'reason' => self::REASON];
        $this->actingAs($manager)->postJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors('graduation');
        $this->publishedResult($target, $targetVersion, $approver, [
            'progression' => 'none', 'completion_credits' => 600, 'completion_alignment' => 'identical_units',
        ], true, edition: 2);
        $this->post($url, $payload)->assertStatus(303);
        $case = AcademicLifecycleCase::sole();
        $this->actingAs($approver)->post(route(self::PREFIX.'decide', $case), [
            'action' => 'approve', 'revision' => 1, 'reason' => self::REASON,
        ])->assertStatus(303);
        $proof = $case->fresh()->context['completion'];
        $this->assertSame(600, $proof['credits']);
        $this->assertCount(2, $proof['units']);
        $this->assertSame('identical_units', $proof['alignment']);
    }

    private function context(bool $twoLevels = false): array
    {
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->sole();
        $entry->update(['matricule' => 'PARCOURS-001']);
        $university = University::create(['context_key' => 'current', 'name' => 'Université de test', 'code' => 'TEST-UNI', 'is_active' => true]);
        $entry->level->faculty->forceFill(['university_id' => $university->id])->save();
        $cycle = AcademicCycle::create(['university_id' => $university->id, 'code' => 'TEST-C', 'name' => 'Cycle test', 'normal_duration' => 2,
            'progression_mode' => 'custom', 'weighting_mode' => 'credits', 'periods' => [['code' => 'P', 'name' => 'Période']]]);
        $program = AcademicProgram::create(['faculty_id' => $entry->level->faculty_id, 'academic_cycle_id' => $cycle->id, 'code' => 'TEST-P', 'name' => 'Programme test', 'degree' => 'Grade test']);
        $program->levels()->attach($entry->level_id, ['position' => 1]);
        $next = $twoLevels ? Level::create(['faculty_id' => $entry->level->faculty_id, 'title' => 'Niveau suivant', 'code' => 'T2']) : null;
        if ($next) {
            $program->levels()->attach($next->id, ['position' => 2]);
        }

        return [$student, $entry, $program, $this->staff([AcademicLifecycle::MANAGE, 'publish academic content']),
            $this->staff([AcademicLifecycle::APPROVE, AcademicLifecycle::GRADUATE, 'publish academic content']), $next];
    }

    private function staff(array $permissions): User
    {
        $user = User::factory()->create()->assignRole(Role::findOrCreate('admin', 'web'));
        foreach (['manage academic access', ...$permissions] as $permission) {
            $user->givePermissionTo(Permission::findOrCreate($permission, 'web'));
        }

        return $user;
    }

    private function nextYear(): AcademicYear
    {
        return AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'open']);
    }

    private function version(AcademicEnrollment $entry, AcademicProgram $program, AcademicYear $year, string $code): CurriculumVersion
    {
        $version = CurriculumVersion::create(['academic_program_id' => $program->id, 'academic_year_id' => $year->id, 'code' => $code, 'name' => $code,
            'status' => 'draft', 'weighting_mode' => 'credits', 'periods' => [['code' => 'P', 'name' => 'Période']],
            'program_snapshot' => ['degree' => 'Grade test', 'name' => 'Programme test', 'cycle' => 'Cycle test', 'level_order' => $program->levels()->pluck('levels.id')->all()]]);
        foreach ($program->levels as $level) {
            $course = Courses::where('level_id', $level->id)->where('code', 'EC-TEST')->first();
            if (! $course) {
                $course = (new Courses)->forceFill(['level_id' => $level->id, 'code' => 'EC-TEST', 'title' => 'Enseignement test', 'credits' => 3, 'semester' => 1]);
                $course->save();
            }
            $unit = $version->units()->create(['level_id' => $level->id, 'level_code' => $level->code, 'level_title' => $level->title,
                'period_code' => 'P', 'period_name' => 'Période', 'code' => 'UE', 'name' => 'Unité test', 'expected_credits' => 3]);
            $unit->items()->create(['source_course_id' => $course->id, 'code' => 'EC', 'name' => 'Enseignement test', 'credits' => 3]);
        }
        $version->update(['status' => 'validated', 'validated_at' => now()]);
        $version->update(['status' => 'published', 'published_at' => now()]);

        return $version;
    }

    private function publishedResult(AcademicEnrollment $entry, CurriculumVersion $version, User $actor, array $decision, bool $passed, int $edition = 1): AcademicOfficialResult
    {
        $unit = $version->units()->where('level_id', $entry->level_id)->sole();
        $item = $unit->items()->sole();
        $rule = AcademicResultRule::create(['curriculum_version_id' => $version->id, 'level_id' => $entry->level_id, 'session_code' => 'P', 'code' => 'TEST-'.$edition,
            'effective_on' => $entry->academicYear->start_date, 'reference' => 'Règlement de test',
            'configuration' => ['decisions' => ['test' => $decision]], 'author_id' => $actor->id, 'approved_at' => now()]);
        $run = AcademicDeliberation::create(['academic_result_rule_id' => $rule->id, 'scope_key' => 'TEST:'.$entry->id, 'edition' => $edition,
            'state' => 'published', 'reference' => (string) Str::uuid(), 'context' => ['decisions' => ['test' => $decision]],
            'jury' => [], 'meeting_at' => now(), 'approved_at' => now(), 'published_at' => now()]);
        $status = $passed ? 'passed' : 'failed';

        return $run->results()->create(['academic_enrollment_id' => $entry->id, 'reference' => (string) Str::uuid(), 'decision' => 'test',
            'snapshot' => ['credits' => ['earned' => $passed ? 300 : 0, 'remaining' => $passed ? 0 : 300], 'anomalies' => [], 'eliminatory' => false,
                'units' => [['id' => $unit->id, 'name' => $unit->name, 'status' => $status, 'earned_credits' => $passed ? 300 : 0,
                    'items' => [['id' => $item->id, 'name' => $item->name, 'status' => $status, 'credits' => 300]]]]],
        ]);
    }
}
