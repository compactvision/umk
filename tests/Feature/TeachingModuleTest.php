<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeachingModuleTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'admin', bool $publish = true): User
    {
        $user = (new User)->forceFill(['first_name' => 'Test', 'last_name' => 'Admin', 'email' => uniqid().'@example.test', 'password' => 'password', 'email_verified_at' => now()]);
        $user->save();
        $user->assignRole(Role::findOrCreate($role, 'web'));
        if ($publish) $user->givePermissionTo(Permission::findOrCreate('publish academic content', 'web'));
        return $user;
    }

    private function professor(string $email = 'prof@example.test'): Professor
    {
        return Professor::create(['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => $email, 'is_active' => true]);
    }

    private function context(): array
    {
        $faculty = Faculty::create(['name' => 'Droit', 'code' => 'DR']);
        $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence 1', 'code' => 'L1']);
        $course = (new Courses)->forceFill(['level_id' => $level->id, 'title' => 'Droit civil', 'semester' => 1, 'credits' => 6]);
        $course->save();
        $year = AcademicYear::create(['title' => '2026–2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        return [$level, $course, $year];
    }

    public function test_admin_can_create_edit_search_and_deactivate_a_professor(): void
    {
        $this->actingAs($this->user());
        $payload = ['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => 'anne@example.test', 'is_active' => true, 'speciality' => 'Droit civil'];
        $this->post('/dashboard/admin/professors', $payload)->assertSessionHasNoErrors();
        $professor = Professor::firstOrFail();
        $this->put('/dashboard/admin/professors/'.$professor->id, $payload + ['phone' => '+243123456789'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('professors', ['id' => $professor->id, 'phone' => '+243123456789']);
        $this->post('/dashboard/admin/professors', $payload)->assertSessionHasErrors('email');
        $this->get('/dashboard/admin/professors?q=Mbemba')->assertOk()->assertInertia(fn (Assert $p) => $p->component('dashboard/professors/Index')->has('professors.data', 1));
        $this->put('/dashboard/admin/professors/'.$professor->id, array_replace($payload, ['is_active' => false]))->assertSessionHasNoErrors();
        $this->get('/dashboard/admin/professors?status=inactive')->assertInertia(fn (Assert $p) => $p->has('professors.data', 1));
        $this->get('/dashboard/admin/professors/'.$professor->id)->assertOk();
    }

    public function test_affectation_uses_level_year_semester_and_does_not_duplicate(): void
    {
        [$level, $course, $year] = $this->context();
        $professor = $this->professor();
        $this->actingAs($this->user());
        $payload = ['course_id' => $course->id, 'academic_year_id' => $year->id, 'professor_id' => $professor->id, 'is_published' => true];
        $this->post('/dashboard/admin/professors/assignments', $payload)->assertSessionHasNoErrors();
        $offering = AcademicOffering::firstOrFail();
        $this->assertDatabaseHas('academic_offerings', ['id' => $offering->id, 'level_id' => $level->id, 'semester' => '1er semestre', 'professor_id' => $professor->id, 'is_published' => true]);
        $this->post('/dashboard/admin/professors/assignments', $payload)->assertSessionHasErrors('academic_year_id');
        $this->assertDatabaseCount('academic_offerings', 1);
        $this->get('/dashboard/admin/levels/details/'.$level->id)->assertInertia(fn (Assert $p) => $p
            ->has('teachingAssignments', 1)->where('teachingAssignments.0.professor.last_name', 'Mbemba')->has('professors', 1));
        $this->get('/dashboard/admin/professors/'.$professor->id)->assertInertia(fn (Assert $p) => $p->has('assignments', 1)->where('assignments.0.course.title', 'Droit civil'));
        $nextYear = AcademicYear::create(['title' => '2027–2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'closed']);
        $this->post('/dashboard/admin/professors/assignments', array_replace($payload, ['academic_year_id' => $nextYear->id]))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('academic_offerings', 2);
    }

    public function test_reassignment_and_removal_preserve_teaching_content_and_scope(): void
    {
        [$level, $course, $year] = $this->context();
        $first = $this->professor();
        $second = $this->professor('second@example.test');
        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $level->id, 'academic_year_id' => $year->id, 'professor_id' => $first->id, 'is_optional' => true, 'semester' => 'Période spéciale', 'is_published' => false]);
        $this->actingAs($this->user());
        $payload = ['course_id' => $course->id, 'academic_year_id' => $year->id, 'professor_id' => $second->id, 'is_published' => true];
        $this->put('/dashboard/admin/professors/assignments/'.$offering->id, $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('academic_offerings', ['id' => $offering->id, 'professor_id' => $second->id, 'is_optional' => true, 'semester' => 'Période spéciale']);
        $other = (new Courses)->forceFill(['level_id' => $level->id, 'title' => 'Autre cours']); $other->save();
        $this->put('/dashboard/admin/professors/assignments/'.$offering->id, array_replace($payload, ['course_id' => $other->id]))->assertSessionHasErrors('course_id');
        $this->put('/dashboard/admin/professors/assignments/'.$offering->id, array_replace($payload, ['professor_id' => null]))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('academic_offerings', ['id' => $offering->id, 'professor_id' => null]);
    }

    public function test_course_assistant_and_organization_can_be_configured(): void
    {
        [$level, $course, $year] = $this->context();
        $professor = $this->professor(); $assistant = $this->professor('assistant@example.test');
        $this->actingAs($this->user());
        $payload = ['course_id' => $course->id, 'academic_year_id' => $year->id, 'professor_id' => $professor->id,
            'assistant_professor_id' => $assistant->id, 'group_leader_name' => 'Marie Kabeya', 'delivery_mode' => 'hybrid', 'is_published' => true];
        $this->post('/dashboard/admin/professors/assignments', array_replace($payload, ['assistant_professor_id' => $professor->id]))->assertSessionHasErrors('assistant_professor_id');
        $this->post('/dashboard/admin/professors/assignments', $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('academic_offerings', ['course_id' => $course->id, 'assistant_professor_id' => $assistant->id, 'group_leader_name' => 'Marie Kabeya', 'delivery_mode' => 'hybrid']);
    }

    public function test_inactive_professors_and_invalid_inputs_cannot_be_assigned(): void
    {
        [, $course, $year] = $this->context();
        $professor = $this->professor(); $professor->update(['is_active' => false]);
        $this->actingAs($this->user());
        $payload = ['course_id' => $course->id, 'academic_year_id' => $year->id, 'professor_id' => $professor->id, 'is_published' => true];
        $this->post('/dashboard/admin/professors/assignments', $payload)->assertSessionHasErrors('professor_id');
        $this->post('/dashboard/admin/professors/assignments', array_replace($payload, ['course_id' => 9999]))->assertSessionHasErrors('course_id');
        $this->assertDatabaseCount('academic_offerings', 0);
    }

    public function test_student_cannot_manage_professors_or_assignments(): void
    {
        $professor = $this->professor();
        $this->actingAs($this->user('student', false));
        $this->get('/dashboard/admin/professors')->assertForbidden();
        $this->get('/dashboard/admin/professors/'.$professor->id)->assertForbidden();
        $this->post('/dashboard/admin/professors', [])->assertForbidden();
        $this->put('/dashboard/admin/professors/'.$professor->id, [])->assertForbidden();
        $this->post('/dashboard/admin/professors/assignments', [])->assertForbidden();
        $this->put('/dashboard/admin/professors/assignments/1', [])->assertForbidden();
    }

    public function test_admin_without_publication_permission_cannot_assign(): void
    {
        $admin = $this->user('admin', false);
        Role::findByName('admin', 'web')->revokePermissionTo('publish academic content');
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        $this->actingAs($admin)->post('/dashboard/admin/professors/assignments', [])->assertForbidden();
    }
}
