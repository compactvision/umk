<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Models\Student\StudentObligation;
use App\Models\Student\StudentPayment;
use App\Models\Student\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

final class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_counts_and_links_reflect_the_current_year_and_faculty(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 11)->setTime(10, 0));
        $admin = $this->adminWithPermissions(['manage academic access', 'manage academic finance', 'publish academic content']);
        $year = AcademicYear::create(['title' => '2026–2027', 'status' => 'open', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30']);
        $pastYear = AcademicYear::create(['title' => '2025–2026', 'status' => 'closed', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30']);
        $level = $this->level('Droit', 'DR');
        $foreignLevel = $this->level('Médecine', 'MED');
        $faculty = DB::table('levels')->where('id', $level)->value('faculty_id');
        $admin->academicFaculties()->attach($faculty);

        $current = $this->enrollment($level, $year->id, 'confirmed');
        $otherFaculty = $this->enrollment($foreignLevel, $year->id, 'confirmed');
        $otherYear = $this->enrollment($level, $pastYear->id, 'confirmed');
        $this->enrollment($level, $year->id, 'pending_confirmation');
        foreach (['submitted', 'draft'] as $status) {
            Enrollment::create([
                'student_id' => User::factory()->create()->id,
                'level_id' => $level,
                'academic_year_id' => $year->id,
                'status' => $status,
            ]);
        }
        foreach ([$current, $otherFaculty, $otherYear] as $enrollment) {
            $enrollment->application->events()->create(['event' => 'validated', 'actor_id' => $admin->id, 'occurred_at' => now()]);
            StudentObligation::create(['academic_enrollment_id' => $enrollment->id, 'kind' => 'tuition', 'title' => 'Minerval', 'installment' => 1, 'amount_cents' => 10_000]);
            foreach (['confirmed', 'pending'] as $status) {
                StudentPayment::create([
                    'academic_enrollment_id' => $enrollment->id, 'uuid' => Str::uuid(), 'kind' => 'tuition',
                    'amount_cents' => 2500, 'currency' => 'USD', 'status' => $status, 'method' => 'bank_transfer',
                    'reference' => $enrollment->id.'-'.$status, 'recorded_by' => $admin->id,
                    'confirmed_at' => $status === 'confirmed' ? now()->subHour() : null,
                ]);
            }
        }

        $currentOffering = $this->offering($level, $year->id, 'Droit administratif');
        $this->createSession($currentOffering, 1, published: true);
        $this->createSession($currentOffering, 2, published: false);
        $this->createSession($currentOffering, 3, published: true, cancelled: true);
        $this->createSession($this->offering($foreignLevel, $year->id, 'Anatomie'), 1, published: true);
        $this->createSession($this->offering($level, $pastYear->id, 'Droit comparé'), 1, published: true);

        $this->actingAs($admin)->get(route('dashboard.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/index/Index')
            ->where('dashboard.year', ['id' => $year->id, 'title' => $year->title])
            ->where('dashboard.scope.label', 'Droit')
            ->has('dashboard.metrics', 4)
            ->where('dashboard.metrics.0.key', 'students')->where('dashboard.metrics.0.value', 1)
            ->where('dashboard.metrics.1.key', 'admissions')->where('dashboard.metrics.1.value', 3)
            ->where('dashboard.metrics.2.key', 'payments')->where('dashboard.metrics.2.value', 1)
            ->where('dashboard.metrics.3.key', 'sessions')->where('dashboard.metrics.3.value', 1)
            ->where('dashboard.actions.0.count', 1)
            ->where('dashboard.actions.0.href', route('dashboard.admin.enrollments.index', ['year_id' => $year->id, 'faculty_id' => $faculty, 'queue' => 'new'], false))
            ->where('dashboard.actions.2.key', 'confirm-enrollments')->where('dashboard.actions.2.count', 1)
            ->where('dashboard.actions.3.key', 'confirm-payments')->where('dashboard.actions.3.count', 1)
            ->where('dashboard.actions.4.key', 'draft-sessions')->where('dashboard.actions.4.count', 1)
            ->where('dashboard.finance', [['currency' => 'USD', 'billed_cents' => 10_000, 'net_cents' => 2500, 'balance_cents' => 7500]])
            ->has('dashboard.activity', 2)->where('dashboard.activity.0.detail', $current->application->reference)
            ->where('dashboard.activity.1.label', 'Paiement confirmé')
            ->where('dashboard.activity.1.href', route('dashboard.admin.finance.index', ['year' => $year->id, 'academic' => $current->id], false))
            ->has('dashboard.schedule', 1)->where('dashboard.schedule.0.label', 'Droit administratif'));
    }

    public function test_dashboard_omits_unauthorized_data_and_destinations(): void
    {
        $admin = $this->adminWithPermissions([]);
        $this->actingAs($admin)->get(route('dashboard.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('dashboard.year', null)
            ->where('dashboard.scope.label', 'Périmètre institutionnel')
            ->has('dashboard.metrics', 0)
            ->has('dashboard.actions', 0)
            ->has('dashboard.activity', 0)
            ->where('dashboard.admissions', null)
            ->where('dashboard.finance', null)
            ->where('dashboard.schedule', null)
            ->has('dashboard.shortcuts', 1)
            ->where('dashboard.shortcuts.0.key', 'years'));

        $this->actingAs(User::factory()->create())->get(route('dashboard.index'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->missing('dashboard'));
    }

    private function adminWithPermissions(array $permissions): User
    {
        $admin = User::factory()->create();
        $role = Role::findOrCreate('admin', 'web');
        $role->syncPermissions([]);
        $admin->assignRole($role);
        foreach ($permissions as $permission) {
            $admin->givePermissionTo(Permission::findOrCreate($permission, 'web'));
        }

        return $admin;
    }

    private function level(string $name, string $code): int
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => $name, 'code' => $code]);

        return DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence '.$name, 'code' => $code.'1']);
    }

    private function enrollment(int $level, int $year, string $status): AcademicEnrollment
    {
        $student = User::factory()->create();
        $application = Enrollment::create(['student_id' => $student->id, 'level_id' => $level, 'academic_year_id' => $year, 'status' => 'validated']);
        $profile = StudentProfile::create(['user_id' => $student->id]);

        return AcademicEnrollment::create([
            'student_profile_id' => $profile->id, 'application_id' => $application->id, 'level_id' => $level,
            'academic_year_id' => $year, 'enrollment_status' => $status, 'currency' => 'USD',
        ]);
    }

    private function offering(int $level, int $year, string $title): AcademicOffering
    {
        $course = DB::table('courses')->insertGetId(['level_id' => $level, 'title' => $title]);

        return AcademicOffering::create(['level_id' => $level, 'academic_year_id' => $year, 'course_id' => $course, 'is_published' => true]);
    }

    private function createSession(AcademicOffering $offering, int $days, bool $published, bool $cancelled = false): void
    {
        AcademicSession::create([
            'academic_offering_id' => $offering->id, 'starts_at' => now()->addDays($days), 'ends_at' => now()->addDays($days)->addHour(),
            'room' => 'A101', 'is_published' => $published, 'cancelled_at' => $cancelled ? now() : null,
        ]);
    }
}
