<?php

namespace Tests\Feature;

use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\EnrollmentChange;
use App\Models\Student\StudentObligation;
use App\Models\User;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Student\Application\Services\StudentAdmissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class AcademicEnrollmentManagementTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private function context(): array
    {
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->firstOrFail();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));

        return [$admin, $student, $entry];
    }

    private function data(string $status): array
    {
        return ['expected_status' => AcademicEnrollment::firstOrFail()->enrollment_status, 'operation_key' => (string) Str::uuid(), 'reason' => 'Décision administrative motivée et validée.', 'enrollment_status' => $status];
    }

    public function test_leave_resume_and_terminal_states_are_audited_and_idempotent(): void
    {
        [$admin, $student, $entry] = $this->context();
        $url = '/dashboard/admin/student-academic/'.$entry->id.'/transition';
        $data = $this->data('on_leave') + ['ends_at' => now()->addMonth()->toIso8601String()];
        $this->actingAs($student)->post($url, $data)->assertForbidden();
        $this->actingAs($admin)->post($url, $data)->assertSessionHasNoErrors();
        $this->post($url, $data)->assertSessionHasNoErrors();
        $this->assertSame('on_leave', $entry->fresh()->enrollment_status);
        $this->assertSame('active', $entry->profile->student_status);
        $this->assertDatabaseCount('academic_enrollment_changes', 1);
        $this->post($url, array_replace($data, ['enrollment_status' => 'withdrawn']))->assertSessionHasErrors('operation_key');
        $this->post($url, $this->data('confirmed'))->assertSessionHasErrors('enrollment_status');
        StudentObligation::create(['academic_enrollment_id' => $entry->id, 'kind' => 'tuition', 'title' => 'Tranche exonérée', 'installment' => 1, 'amount_cents' => 0]);
        $this->post($url, $this->data('confirmed'))->assertSessionHasNoErrors();
        $this->post($url, $this->data('completed'))->assertSessionHasNoErrors();
        $this->post($url, $this->data('confirmed'))->assertSessionHasErrors('enrollment_status');
        $this->assertSame('completed', $entry->fresh()->enrollment_status);
        $this->assertDatabaseCount('academic_enrollment_changes', 3);
    }

    public function test_scope_applies_to_directory_dossier_writes_and_closure(): void
    {
        [$admin, $student, $entry] = $this->context();
        $foreignFaculty = DB::table('faculties')->insertGetId(['name' => 'Autre faculté', 'code' => 'AUTRE']);
        $admin->academicFaculties()->attach($foreignFaculty);
        $this->actingAs($admin)->get('/dashboard/admin/student-academic')->assertInertia(fn (Assert $page) => $page->has('students.data', 0));
        $this->get('/dashboard/admin/student-academic/'.$entry->id)->assertForbidden();
        $this->post('/dashboard/admin/student-academic/'.$entry->id.'/transition', $this->data('suspended'))->assertForbidden();
        $this->get('/dashboard/admin/student-academic/administration/closure')->assertForbidden();
        $this->patch('/dashboard/admin/academic-years/'.$entry->academic_year_id.'/close', ['reason' => 'Tentative hors périmètre.'])->assertForbidden();
    }

    public function test_group_capacity_and_context_are_enforced_without_erasing_history(): void
    {
        [$admin,, $entry] = $this->context();
        $intake = DB::table('intakes')->insertGetId(['name' => 'Groupe test']);
        $group = Classes::create(['intake_id' => $intake, 'faculty_id' => $entry->level->faculty_id, 'level_id' => $entry->level_id, 'capacity' => 0]);
        $url = '/dashboard/admin/student-academic/'.$entry->id.'/transition';
        $this->actingAs($admin)->post($url, $this->data('confirmed') + ['class_id' => $group->id])->assertSessionHasErrors('class_id');
        $group->update(['capacity' => 1]);
        $this->post($url, $this->data('confirmed') + ['class_id' => $group->id])->assertSessionHasNoErrors();
        $this->post($url, $this->data('confirmed') + ['class_id' => null])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('academic_enrollment_changes', ['academic_enrollment_id' => $entry->id]);
        $this->assertSame($group->id, EnrollmentChange::latest('id')->firstOrFail()->before['class_id']);
    }

    public function test_closure_requires_resolved_cases_and_explicit_reopening(): void
    {
        [$admin,, $entry] = $this->context();
        $year = $entry->academicYear;
        $this->actingAs($admin)->get('/dashboard/admin/student-academic/administration/closure?year='.$year->id)
            ->assertInertia(fn (Assert $page) => $page->where('report.can_close', false)->where('report.unresolved', 1));
        $url = '/dashboard/admin/academic-years/'.$year->id;
        $this->patch($url.'/close', ['reason' => 'Rapport de clôture contrôlé.'])->assertSessionHasErrors('general');
        $this->post('/dashboard/admin/student-academic/'.$entry->id.'/transition', $this->data('completed'))->assertSessionHasNoErrors();
        $this->patch($url.'/close', ['reason' => 'Rapport de clôture contrôlé.'])->assertSessionHasNoErrors();
        $this->assertSame('closed', $year->fresh()->status);
        $this->patch($url.'/open')->assertSessionHasErrors('general');
        $admin->givePermissionTo(Permission::findOrCreate('configure settings', 'web'));
        $this->actingAs($admin->fresh())->patch($url.'/open', ['reason' => 'Réouverture exceptionnelle autorisée.'])->assertSessionHasNoErrors();
        $this->assertSame('open', $year->fresh()->status);
        $this->assertDatabaseHas('academic_audits', ['entity_type' => 'academic_years', 'entity_id' => $year->id, 'action' => 'academic_year_reopened']);
    }

    public function test_student_sees_only_own_annual_contexts_and_cannot_choose_another_profile(): void
    {
        [$admin, $student, $entry] = $this->context();
        $this->actingAs($student)->get('/dashboard/student/enrollments?academic=99999')
            ->assertInertia(fn (Assert $page) => $page->has('entries.data', 1)->where('entries.data.0.id', $entry->id)->missing('changes.data.0.reason'));
        $this->get('/dashboard/admin/student-academic/administration')->assertForbidden();
        $this->actingAs($admin)->get('/dashboard/admin/student-academic/administration?academic='.$entry->id)
            ->assertInertia(fn (Assert $page) => $page->where('selected.id', $entry->id)->has('transitions'));
    }

    public function test_transfer_is_atomic_idempotent_and_keeps_the_financial_and_academic_source(): void
    {
        [$admin, $student, $source] = $this->context();
        $university = University::create(['context_key' => 'current', 'code' => 'TEST', 'name' => 'Université de test', 'is_active' => true]);
        $source->level->faculty->forceFill(['university_id' => $university->id, 'is_active' => true])->save();
        $cycle = AcademicCycle::create(['university_id' => $university->id, 'code' => 'C1', 'name' => 'Cycle', 'normal_duration' => 3, 'progression_mode' => 'custom', 'weighting_mode' => 'credits', 'periods' => [['code' => 'P1', 'name' => 'Période']]]);
        $level = Level::create(['faculty_id' => $source->level->faculty_id, 'code' => 'N2', 'title' => 'Autre parcours', 'is_active' => true]);
        $program = AcademicProgram::create(['faculty_id' => $source->level->faculty_id, 'academic_cycle_id' => $cycle->id, 'code' => 'P1', 'name' => 'Programme cible', 'is_active' => true]);
        $program->levels()->attach($level->id, ['position' => 1]);
        // Fixed published fixture; the publication workflow itself has dedicated integration tests.
        $versionId = DB::table('curriculum_versions')->insertGetId([
            'academic_program_id' => $program->id, 'academic_year_id' => $source->academic_year_id, 'code' => 'V1', 'name' => 'Version cible', 'status' => 'published', 'published_at' => now(), 'weighting_mode' => 'credits', 'program_snapshot' => json_encode(['name' => $program->name, 'cycle' => 'Cycle']), 'periods' => '[]',
        ]);
        DB::table('curriculum_units')->insert(['curriculum_version_id' => $versionId, 'level_id' => $level->id, 'level_code' => 'N2', 'level_title' => 'Autre parcours', 'period_code' => 'P1', 'period_name' => 'Période', 'code' => 'UE1', 'name' => 'Unité']);
        StudentObligation::create(['academic_enrollment_id' => $source->id, 'kind' => 'tuition', 'title' => 'Dette historique', 'installment' => 1, 'amount_cents' => 10000]);
        $data = ['expected_status' => $source->enrollment_status, 'operation_key' => (string) Str::uuid(), 'level_id' => $level->id, 'curriculum_version_id' => $versionId, 'reason' => 'Réorientation approuvée par décision officielle.'];
        $url = '/dashboard/admin/student-academic/'.$source->id.'/transfer';
        $this->actingAs($student)->post($url, $data)->assertForbidden();
        $this->actingAs($admin)->post($url, $data)->assertSessionHasNoErrors();
        $this->post($url, $data)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_enrollment_changes', 1);
        $target = AcademicEnrollment::whereKeyNot($source->id)->firstOrFail();
        $this->assertSame('transferred', $source->fresh()->enrollment_status);
        $this->assertSame($source->student_profile_id, $target->student_profile_id);
        $this->assertSame($source->matricule, $target->matricule);
        $this->assertSame($versionId, $target->curriculum_version_id);
        $this->assertSame('pending_confirmation', $target->enrollment_status);
        $this->assertDatabaseHas('student_obligations', ['academic_enrollment_id' => $source->id, 'amount_cents' => 10000]);
        $this->assertSame(0, $target->obligations()->count());
        $this->assertDatabaseCount('student_profiles', 1);
        $this->assertDatabaseCount('notifications', 1);
        $this->actingAs($student)->get('/dashboard/student/enrollments')->assertInertia(fn (Assert $page) => $page->has('entries.data', 2));
    }

    public function test_closed_year_refuses_first_activation_without_creating_a_student_profile(): void
    {
        $student = User::factory()->create();
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Faculté', 'code' => 'NEW']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Niveau', 'code' => 'N1']);
        $year = AcademicYear::create(['title' => 'Année fermée', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30', 'status' => 'closed']);
        $application = Enrollment::create(['student_id' => $student->id, 'level_id' => $level, 'academic_year_id' => $year->id, 'status' => 'validated', 'meta' => ['required_documents' => []]]);
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        try {
            app(StudentAdmissionService::class)->activate($application, $admin->id, false);
            $this->fail('Activation must reject a closed year.');
        } catch (InvalidEnrollmentStateException) {
            $this->assertDatabaseCount('student_profiles', 0);
            $this->assertDatabaseCount('academic_enrollments', 0);
        }
    }

    public function test_stale_decision_is_rejected_and_malformed_context_is_validated(): void
    {
        [$admin,, $entry] = $this->context();
        $url = '/dashboard/admin/student-academic/'.$entry->id.'/transition';
        $data = $this->data('suspended');
        $this->actingAs($admin)->post($url, $data)->assertSessionHasNoErrors();
        $this->post($url, array_replace($data, ['operation_key' => (string) Str::uuid(), 'enrollment_status' => 'on_leave']))->assertSessionHasErrors('enrollment_status');
        $this->assertSame('suspended', $entry->fresh()->enrollment_status);
        $this->get('/dashboard/admin/student-academic?academic[]=1')->assertSessionHasErrors('academic');
    }
}
