<?php

namespace Tests\Feature;

use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\AcademicDepartment;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Level;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicProgression;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSession;
use App\Models\Student\AcademicUnitResult;
use App\Models\Student\EnrollmentChange;
use App\Models\Student\ServiceRequest;
use App\Models\User;
use App\Modules\Student\Application\Services\AcademicEnrollmentService;
use App\Modules\Student\Application\Services\EnrollmentMembershipHistory;
use App\Modules\Student\Application\Services\StudentFinanceService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class EnrollmentManagementFollowupTest extends TestCase
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

    private function group(AcademicEnrollment $entry, string $name): Classes
    {
        $intake = DB::table('intakes')->insertGetId(['name' => $name]);

        return Classes::create(['intake_id' => $intake, 'faculty_id' => $entry->level->faculty_id, 'level_id' => $entry->level_id]);
    }

    private function decision(AcademicEnrollment $entry, array $overrides = []): array
    {
        return array_replace([
            'operation_key' => (string) Str::uuid(), 'enrollment_status' => $entry->enrollment_status,
            'expected_status' => $entry->enrollment_status, 'expected_context' => AcademicEnrollmentService::contextToken($entry),
            'reason' => 'Motif administratif interne et documenté.',
        ], $overrides);
    }

    public function test_same_status_group_conflict_is_rejected_and_no_op_replays_are_recorded_once(): void
    {
        [$admin,, $entry] = $this->context();
        $group = $this->group($entry, 'Groupe cible');
        $url = '/dashboard/admin/student-academic/'.$entry->id.'/transition';
        $initial = $this->decision($entry);
        $this->actingAs($admin)->post($url, $initial)->assertSessionHasNoErrors();
        $this->post($url, $initial)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_enrollment_changes', 1);
        $this->assertDatabaseCount('notifications', 1);
        $stale = $this->decision($entry, ['class_id' => null]);
        $this->post($url, $this->decision($entry, ['class_id' => $group->id]))->assertSessionHasNoErrors();
        $this->post($url, $stale)->assertSessionHasErrors('expected_context');
        $this->assertSame($group->id, $entry->fresh()->class_id);
        $this->assertDatabaseCount('academic_enrollment_changes', 2);
    }

    public function test_decision_resolves_only_its_own_request_and_preserves_private_reason(): void
    {
        [$admin, $student, $entry] = $this->context();
        $other = $entry->replicate();
        $other->academic_year_id = AcademicYear::create(['title' => 'Autre année', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'draft'])->id;
        $other->save();
        $foreignTicket = ServiceRequest::create(['academic_enrollment_id' => $other->id, 'category' => 'appeal', 'subject' => 'Autre contexte', 'body' => 'Demande historique.']);
        $url = '/dashboard/admin/student-academic/'.$entry->id.'/transition';
        $bad = $this->decision($entry, ['enrollment_status' => 'on_leave', 'service_request_id' => $foreignTicket->id, 'student_response' => 'Votre demande a été examinée.']);
        $this->actingAs($admin)->post($url, $bad)->assertNotFound();
        $this->assertSame('confirmed', $entry->fresh()->enrollment_status);
        $this->assertDatabaseCount('academic_enrollment_changes', 0);
        $ticket = ServiceRequest::create(['academic_enrollment_id' => $entry->id, 'category' => 'appeal', 'subject' => 'Demande de congé', 'body' => 'Je demande un congé.']);
        $data = $this->decision($entry, ['enrollment_status' => 'on_leave', 'service_request_id' => $ticket->id, 'student_response' => 'Votre congé académique est accordé.']);
        $this->post($url, $data)->assertSessionHasNoErrors();
        $this->post($url, $data)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('student_service_requests', ['id' => $ticket->id, 'status' => 'resolved', 'response' => $data['student_response'], 'responded_by' => $admin->id]);
        $this->assertDatabaseHas('student_service_requests', ['id' => $foreignTicket->id, 'status' => 'open']);
        $this->assertDatabaseCount('academic_enrollment_changes', 1);
        $this->assertDatabaseCount('notifications', 1);
        $this->actingAs($student)->get('/dashboard/student/enrollments')->assertInertia(fn (Assert $page) => $page->has('entries.data', 2)->missing('changes.data.0.reason')->missing('changes.data.0.actor'));
    }

    public function test_old_and_new_schedule_memberships_are_date_bounded_without_restoring_old_resources(): void
    {
        [$admin, $student, $entry] = $this->context();
        $this->travelTo(now()->setDate(2026, 11, 7)->setTime(12, 0));
        $a = $this->group($entry, 'Groupe A');
        $b = $this->group($entry, 'Groupe B');
        $departmentA = AcademicDepartment::create(['faculty_id' => $entry->level->faculty_id, 'code' => 'DA', 'name' => 'Département A', 'is_active' => true]);
        $departmentB = AcademicDepartment::create(['faculty_id' => $entry->level->faculty_id, 'code' => 'DB', 'name' => 'Département B', 'is_active' => true]);
        $entry->level->departmentOptions()->attach([$departmentA->id, $departmentB->id]);
        $entry->update(['class_id' => $a->id, 'academic_department_id' => $departmentA->id]);
        $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'title' => 'Cours avec groupes', 'code' => 'G1']);
        $course->save();
        $offeringA = AcademicOffering::create(['level_id' => $entry->level_id, 'course_id' => $course->id, 'academic_year_id' => $entry->academic_year_id, 'class_id' => $a->id, 'academic_department_id' => $departmentA->id, 'is_published' => true]);
        $offeringB = AcademicOffering::create(['level_id' => $entry->level_id, 'course_id' => $course->id, 'academic_year_id' => $entry->academic_year_id, 'class_id' => $b->id, 'academic_department_id' => $departmentB->id, 'is_published' => true]);
        $sessions = [];
        foreach (['old' => $offeringA, 'new' => $offeringB] as $key => $offering) {
            foreach (['past' => -1, 'future' => 1] as $when => $days) {
                $sessions[$key.'_'.$when] = AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => now()->addDays($days), 'ends_at' => now()->addDays($days)->addHour(), 'room' => $key.' '.$when, 'is_published' => true]);
            }
        }
        AcademicAttendance::create(['academic_enrollment_id' => $entry->id, 'academic_session_id' => $sessions['old_past']->id, 'status' => 'present', 'recorded_by' => $admin->id]);
        $this->actingAs($admin)->post('/dashboard/admin/student-academic/'.$entry->id.'/transition', $this->decision($entry, ['class_id' => $b->id, 'academic_department_id' => $departmentB->id]))->assertSessionHasNoErrors();
        $this->actingAs($student)->get('/dashboard/student/schedule?week=2026-11-02')->assertInertia(fn (Assert $page) => $page->has('sessions', 2)
            ->where('sessions.0.id', $sessions['old_past']->id)->where('sessions.1.id', $sessions['new_future']->id));
        $this->get('/dashboard/student/overview?week=2026-11-02')->assertInertia(fn (Assert $page) => $page->where('overview.week_count', 2));
        $this->get('/dashboard/student/courses/'.$course->id.'/attendance')->assertInertia(fn (Assert $page) => $page->has('attendance.data', 1)->where('attendance.data.0.status', 'present'));
        $resource = AcademicResource::create(['academic_offering_id' => $offeringA->id, 'kind' => 'announcement', 'title' => 'Ressource ancien groupe', 'is_published' => true]);
        $this->get('/dashboard/student/resources/'.$resource->id.'/download')->assertNotFound();
        $this->assertDatabaseCount('academic_sessions', 4);
        $this->assertDatabaseCount('academic_attendances', 1);
    }

    public function test_student_page_exposes_the_official_renewal_without_creating_a_new_identity(): void
    {
        [$admin, $student, $entry] = $this->context();
        $entry->profile->update(['matricule' => 'PERMANENT-001']);
        $entry->update(['matricule' => 'PERMANENT-001', 'enrollment_status' => 'completed']);
        $year = AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'open']);
        $decision = AcademicProgression::create(['source_enrollment_id' => $entry->id, 'level_id' => $entry->level_id, 'academic_year_id' => $year->id, 'decided_by' => $admin->id, 'reason' => 'Poursuite autorisée dans le même niveau.']);
        $this->actingAs($student)->get('/dashboard/student/enrollments')->assertInertia(fn (Assert $page) => $page->where('entries.data.0.renewal.id', $decision->id)->where('entries.data.0.renewal.can_start', true));
        $url = '/dashboard/student/renewals/'.$decision->id.'?academic='.$entry->id;
        $this->post($url)->assertSessionHasNoErrors();
        $this->post($url)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('student_profiles', 1);
        $this->assertDatabaseCount('academic_enrollments', 2);
        $this->assertSame('PERMANENT-001', $decision->fresh()->target->matricule);
        $this->get('/dashboard/student/enrollments')->assertInertia(fn (Assert $page) => $page->where('entries.data.1.renewal.target_id', $decision->fresh()->target_enrollment_id));
    }

    public function test_annual_filters_include_promotions_and_private_decisions_are_not_shared_with_finance_only(): void
    {
        [$admin,, $entry] = $this->context();
        $university = University::create(['context_key' => 'current', 'code' => 'U', 'name' => 'Université']);
        $entry->level->faculty->forceFill(['university_id' => $university->id])->save();
        $cycle = AcademicCycle::create(['university_id' => $university->id, 'code' => 'C', 'name' => 'Cycle', 'normal_duration' => 3, 'progression_mode' => 'custom', 'weighting_mode' => 'credits', 'periods' => []]);
        $program = AcademicProgram::create(['faculty_id' => $entry->level->faculty_id, 'academic_cycle_id' => $cycle->id, 'code' => 'P', 'name' => 'Programme']);
        $promotion = AcademicPromotion::create(['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'level_id' => $entry->level_id, 'code' => 'P1', 'name' => 'Promotion annuelle']);
        $group = $this->group($entry, 'Groupe promotion');
        $group->forceFill(['academic_promotion_id' => $promotion->id])->save();
        $version = DB::table('curriculum_versions')->insertGetId(['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'code' => 'V', 'name' => 'Version', 'weighting_mode' => 'credits', 'program_snapshot' => json_encode(['name' => 'Programme historique']), 'periods' => '[]']);
        $entry->forceFill(['curriculum_version_id' => $version, 'class_id' => $group->id])->save();
        $base = '/dashboard/admin/student-academic/administration';
        $filters = ['faculty' => $entry->level->faculty_id, 'program' => $program->id, 'level' => $entry->level_id, 'promotion' => $promotion->id, 'group' => $group->id, 'status' => 'confirmed', 'year' => $entry->academic_year_id];
        $this->actingAs($admin)->get($base.'?'.http_build_query($filters))->assertInertia(fn (Assert $page) => $page->has('entries.data', 1)->where('entries.data.0.promotion', 'Promotion annuelle')->where('entries.data.0.program', 'Programme historique'));
        $this->get($base.'?'.http_build_query(array_replace($filters, ['status' => 'on_leave'])))->assertInertia(fn (Assert $page) => $page->has('entries.data', 0));
        $this->get($base.'?status=invalid')->assertSessionHasErrors('status');
        Role::findByName('admin', 'web')->syncPermissions([]);
        $finance = User::factory()->create();
        $finance->assignRole('admin');
        $finance->givePermissionTo(Permission::findOrCreate('manage academic finance', 'web'));
        $this->actingAs($finance)->get($base.'?academic='.$entry->id)->assertInertia(fn (Assert $page) => $page->where('changes', null)->has('transitions', 0)->has('openRequests', 0)->where('canClose', false));
    }

    private function publishedVersion(AcademicEnrollment $entry, string $code): array
    {
        $university = University::firstOrCreate(['context_key' => 'current'], ['code' => 'UNIVERSITY', 'name' => 'Université', 'is_active' => true]);
        $entry->level->faculty->forceFill(['university_id' => $university->id, 'is_active' => true])->save();
        $cycle = AcademicCycle::firstOrCreate(['university_id' => $university->id, 'code' => 'CYCLE'], ['name' => 'Cycle', 'normal_duration' => 3, 'progression_mode' => 'custom', 'weighting_mode' => 'credits', 'periods' => []]);
        $program = AcademicProgram::create(['faculty_id' => $entry->level->faculty_id, 'academic_cycle_id' => $cycle->id, 'code' => $code, 'name' => 'Programme '.$code, 'is_active' => true]);
        $program->levels()->attach($entry->level_id, ['position' => 1]);
        $versionId = DB::table('curriculum_versions')->insertGetId(['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'code' => $code, 'name' => 'Version '.$code, 'status' => 'published', 'published_at' => now(), 'weighting_mode' => 'credits', 'program_snapshot' => json_encode(['name' => $program->name, 'cycle' => 'Cycle']), 'periods' => '[]']);
        $unitId = DB::table('curriculum_units')->insertGetId(['curriculum_version_id' => $versionId, 'level_id' => $entry->level_id, 'level_code' => 'N1', 'level_title' => $entry->level->title, 'period_code' => 'P1', 'period_name' => 'Période', 'code' => 'UE', 'name' => 'Unité']);

        return [$versionId, $unitId];
    }

    public function test_same_level_reorientation_versions_context_and_preserves_source_ledger_and_results(): void
    {
        [$admin, $student, $entry] = $this->context();
        [$sourceVersion, $unitId] = $this->publishedVersion($entry, 'SOURCE');
        [$targetVersion] = $this->publishedVersion($entry, 'TARGET');
        $entry->forceFill(['curriculum_version_id' => $sourceVersion])->save();
        $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Dette source', 'installment' => 1, 'amount_cents' => 10000]);
        AcademicUnitResult::create(['academic_enrollment_id' => $entry->id, 'curriculum_unit_id' => $unitId, 'score' => 12.5, 'validated' => true]);
        $payment = app(StudentFinanceService::class)->record($entry, $admin, ['kind' => 'tuition', 'amount' => '20.00', 'method' => 'cash', 'reference' => 'SOURCE-PAYMENT', 'note' => 'Versement historique conservé.']);
        $before = $entry->fresh()->only(['student_profile_id', 'application_id', 'level_id', 'academic_year_id', 'matricule', 'curriculum_version_id', 'created_at']);
        $data = $this->decision($entry->fresh()) + ['level_id' => $entry->level_id, 'curriculum_version_id' => $targetVersion];
        unset($data['enrollment_status']);
        $url = '/dashboard/admin/student-academic/'.$entry->id.'/transfer';
        $this->actingAs($admin)->post($url, $data)->assertSessionHasNoErrors();
        $this->post($url, $data)->assertSessionHasNoErrors();
        $target = AcademicEnrollment::whereKeyNot($entry->id)->firstOrFail();
        $this->assertEquals($before, $entry->fresh()->only(array_keys($before)));
        $this->assertNull($entry->fresh()->context_slot);
        $this->assertSame('transferred', $entry->fresh()->enrollment_status);
        $this->assertSame(1, $target->context_slot);
        $this->assertSame($entry->level_id, $target->level_id);
        $this->assertSame($targetVersion, $target->curriculum_version_id);
        $this->assertDatabaseCount('student_profiles', 1);
        $this->assertDatabaseCount('academic_enrollment_changes', 1);
        $this->assertDatabaseHas('student_payments', ['id' => $payment->id, 'academic_enrollment_id' => $entry->id]);
        $this->assertDatabaseHas('academic_unit_results', ['academic_enrollment_id' => $entry->id, 'score' => 12.5]);
        $this->assertSame(0, $target->obligations()->count());
        $this->assertSame(0, $target->payments()->count());
        $segments = app(EnrollmentMembershipHistory::class)->segments($target);
        $this->assertNotNull($segments[0]['from']);
        $this->actingAs($student)->get('/dashboard/student/enrollments')->assertInertia(fn (Assert $page) => $page->has('entries.data', 2)->where('entries.data.0.program', 'Programme TARGET')->where('entries.data.1.program', 'Programme SOURCE'));
        try {
            DB::transaction(fn () => $target->replicate()->save());
            $this->fail('A reserved context must remain unique.');
        } catch (UniqueConstraintViolationException) {
            $this->assertDatabaseCount('academic_enrollments', 2);
        }
        $migration = require database_path('migrations/2026_11_07_150000_version_academic_enrollment_contexts.php');
        try {
            $migration->down();
            $this->fail('Rollback must preserve published historical contexts.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('contextes versionnés', $exception->getMessage());
        }
    }

    public function test_context_migration_preserves_existing_rows_and_failed_binding_keeps_the_reservation(): void
    {
        [$admin,, $entry] = $this->context();
        $migration = require database_path('migrations/2026_11_07_150000_version_academic_enrollment_contexts.php');
        $migration->down();
        $before = (array) DB::table('academic_enrollments')->where('id', $entry->id)->first();
        $migration->up();
        $after = (array) DB::table('academic_enrollments')->where('id', $entry->id)->first();
        $this->assertSame(1, $after['context_slot']);
        unset($after['context_slot']);
        $this->assertSame($before, $after);
        [$sourceVersion] = $this->publishedVersion($entry, 'SOURCE');
        [$badVersion] = $this->publishedVersion($entry, 'INVALID');
        $entry->forceFill(['curriculum_version_id' => $sourceVersion])->save();
        $otherYear = AcademicYear::create(['title' => 'Année incompatible', 'start_date' => '2028-10-01', 'end_date' => '2029-09-30', 'status' => 'draft']);
        DB::table('curriculum_versions')->where('id', $badVersion)->update(['academic_year_id' => $otherYear->id]);
        $data = $this->decision($entry->fresh()) + ['level_id' => $entry->level_id, 'curriculum_version_id' => $badVersion];
        $this->actingAs($admin)->post('/dashboard/admin/student-academic/'.$entry->id.'/transfer', $data)->assertSessionHasErrors('academic_year_id');
        $this->assertDatabaseCount('academic_enrollments', 1);
        $this->assertSame('confirmed', $entry->fresh()->enrollment_status);
        $this->assertSame(1, $entry->fresh()->context_slot);
        $this->assertDatabaseCount('academic_enrollment_changes', 0);
    }

    public function test_capacity_changes_preserve_existing_memberships_and_require_the_faculty_scope(): void
    {
        [$admin, $student, $entry] = $this->context();
        $group = $this->group($entry, 'Groupe occupé');
        $entry->update(['class_id' => $group->id]);
        $url = '/dashboard/admin/student-academic/groups/'.$group->id.'/capacity';
        $this->actingAs($student)->post($url, ['capacity' => 1, 'reason' => 'Tentative sans habilitation.'])->assertForbidden();
        $this->actingAs($admin)->post($url, ['capacity' => 0, 'reason' => 'Réduction de capacité du groupe.'])->assertSessionHasErrors('capacity');
        $this->assertNull($group->fresh()->capacity);
        $this->post($url, ['capacity' => 1, 'reason' => 'Capacité approuvée par la scolarité.'])->assertSessionHasNoErrors();
        $this->post($url, ['capacity' => 1, 'reason' => 'Capacité approuvée par la scolarité.'])->assertSessionHasNoErrors();
        $this->assertSame(1, $group->fresh()->capacity);
        $this->assertSame($group->id, $entry->fresh()->class_id);
        $this->assertSame(1, AcademicAudit::where('action', 'academic_group_capacity_changed')->count());
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Autre faculté', 'code' => 'OTHER']);
        $admin->academicFaculties()->attach($faculty);
        $this->post($url, ['capacity' => 2, 'reason' => 'Tentative hors périmètre.'])->assertForbidden();
        $this->get('/dashboard/admin/student-academic/administration')->assertInertia(fn (Assert $page) => $page->has('entries.data', 0)->has('filterOptions.faculties', 1)->where('filterOptions.faculties.0.id', $faculty));
    }

    public function test_migration_recognizes_preexisting_audited_transfers_without_rewriting_business_data(): void
    {
        [$admin,, $source] = $this->context();
        $level = Level::create(['faculty_id' => $source->level->faculty_id, 'title' => 'Autre niveau', 'code' => 'OTHER', 'is_active' => true]);
        $target = $source->replicate();
        $target->level_id = $level->id;
        $target->save();
        $source->update(['enrollment_status' => 'transferred']);
        EnrollmentChange::create([
            'academic_enrollment_id' => $source->id, 'target_enrollment_id' => $target->id, 'actor_id' => $admin->id,
            'operation_key' => (string) Str::uuid(), 'request_hash' => str_repeat('a', 64), 'action' => 'transfer',
            'before' => ['enrollment_status' => 'confirmed'], 'after' => ['enrollment_status' => 'pending_confirmation'],
            'reason' => 'Transfert historique déjà approuvé.', 'effective_at' => now(), 'created_at' => now(),
        ]);
        $migration = require database_path('migrations/2026_11_07_150000_version_academic_enrollment_contexts.php');
        $migration->down();
        $before = (array) DB::table('academic_enrollments')->where('id', $source->id)->first();
        $migration->up();
        $after = (array) DB::table('academic_enrollments')->where('id', $source->id)->first();
        $this->assertNull($after['context_slot']);
        unset($after['context_slot']);
        $this->assertSame($before, $after);
        $this->assertSame(1, $target->fresh()->context_slot);
    }
}
