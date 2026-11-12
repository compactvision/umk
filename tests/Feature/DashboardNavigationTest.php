<?php

namespace Tests\Feature;

use App\Models\Professor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use ReflectionMethod;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

final class DashboardNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_named_dashboard_routes_have_callable_controller_actions(): void
    {
        $unavailable = [];
        foreach (Route::getRoutes() as $route) {
            $controller = $route->getControllerClass();
            if (! str_starts_with($route->getName() ?? '', 'dashboard.') || ! str_starts_with($controller ?? '', 'App\\')) {
                continue;
            }

            [, $method] = Str::parseCallback($route->getActionName(), '__invoke');
            if (! method_exists($controller, $method) || ! (new ReflectionMethod($controller, $method))->isPublic()) {
                $unavailable[] = $route->getName();
            }
        }

        $this->assertSame([], $unavailable);
    }

    public function test_teacher_destinations_open_inertia_pages_and_deny_other_roles(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole(Role::findOrCreate('professor', 'web'));
        $candidate = User::factory()->create();
        $candidate->assignRole(Role::findOrCreate('candidate', 'web'));
        $destinations = [
            'dashboard.teaching.index' => 'dashboard/teaching/Teacher',
            'dashboard.teaching.learning.index' => 'dashboard/teaching/Learning',
            'dashboard.teaching.assessments.index' => 'dashboard/teaching/Assessments',
        ];

        $this->actingAs($teacher)->get(route('dashboard.index'))->assertRedirect(route('dashboard.teaching.index'));
        $this->get(route('dashboard.teaching.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('teachingProfileActive', false)->where('linked', false));
        $this->get(route('dashboard.teaching.learning.index'))->assertForbidden();
        Professor::create(['first_name' => 'Odile', 'last_name' => 'Kasa', 'email' => $teacher->email, 'is_active' => true])
            ->forceFill(['user_id' => $teacher->id, 'photo' => 'professors/test-portrait.png'])->save();
        $this->get(route('dashboard.teaching.assessments.index'))->assertForbidden();
        $teacher->givePermissionTo(Permission::findOrCreate('manage courses', 'web'));
        foreach ($destinations as $route => $component) {
            $this->actingAs($teacher)->get(route($route))
                ->assertOk()->assertInertia(fn (Assert $page) => $page->component($component)->where('teachingProfileActive', true));
            $this->actingAs($candidate)->get(route($route))->assertForbidden();
        }
        $this->get(route('dashboard.index'))->assertRedirect(route('dashboard.enrollments.index'));
        $this->get(route('dashboard.enrollments.index'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/enrollments/Index'));
    }

    public function test_admin_navigation_receives_permission_and_faculty_scope(): void
    {
        $admin = User::factory()->create();
        $role = Role::findOrCreate('admin', 'web');
        $role->syncPermissions([]);
        $admin->assignRole($role);
        $admin->givePermissionTo(Permission::findOrCreate('publish academic content', 'web'));
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);

        $this->actingAs($admin)->get(route('dashboard.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.permissions', ['publish academic content'])->where('auth.user.hasAcademicFacultyScope', false));
        $this->get('/dashboard/admin/schedule/resources')->assertOk();
        $admin->academicFaculties()->attach($faculty);
        $this->get(route('dashboard.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.hasAcademicFacultyScope', true));
        $this->get('/dashboard/admin/schedule/resources')->assertForbidden();
        $this->get(route('dashboard.admin.enrollments.index'))->assertForbidden();
    }
}
