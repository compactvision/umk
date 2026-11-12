<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\LevelDetail;
use App\Models\Professor;
use App\Models\User;
use App\Modules\Teaching\Application\Services\TeachingAssignmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CourseCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_combines_faculty_level_and_semester_and_includes_legacy_courses(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $law = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $science = DB::table('faculties')->insertGetId(['name' => 'Sciences', 'code' => 'SC']);
        $first = Level::create(['faculty_id' => $law, 'title' => 'Licence 1', 'code' => 'L1']);
        $second = Level::create(['faculty_id' => $law, 'title' => 'Licence 2', 'code' => 'L2']);
        $other = Level::create(['faculty_id' => $science, 'title' => 'Licence 1', 'code' => 'L1']);
        DB::table('courses')->insert([
            ['level_id' => $first->id, 'title' => 'Droit civil', 'code' => 'DR101', 'semester' => 1],
            ['level_id' => $first->id, 'title' => 'Droit public', 'code' => 'DR102', 'semester' => 2],
            ['level_id' => $second->id, 'title' => 'Droit pénal', 'code' => 'DR201', 'semester' => 1],
            ['level_id' => $other->id, 'title' => 'Biologie', 'code' => 'DR301', 'semester' => 1],
            ['level_id' => $first->id, 'title' => 'Introduction historique', 'code' => null, 'semester' => null],
        ]);
        $index = 'dashboard.admin.course-catalog.index';

        $this->actingAs(User::factory()->create())->get(route($index))->assertForbidden();
        $this->actingAs($admin)->get(route($index))->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/courseCatalog/Index')->where('courses.total', 5));
        $this->get(route($index, ['q' => 'dr', 'faculty' => $law, 'level' => $first->id, 'semester' => 1]))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 1)->where('courses.data.0.code', 'DR101'));
        $this->get(route($index, ['q' => 'CIVIL']))->assertInertia(fn (Assert $page) => $page
            ->where('courses.total', 1)->where('courses.data.0.title', 'Droit civil'));
        $this->get(route($index, ['q' => 'dr301', 'faculty' => $law]))->assertInertia(fn (Assert $page) => $page->where('courses.total', 0));
        $this->get(route($index, ['semester' => 'unassigned']))->assertInertia(fn (Assert $page) => $page
            ->where('courses.total', 1)->where('courses.data.0.code', null));
        $this->get(route('dashboard.admin.levels.details.show', ['id' => $first->id, 'tab' => 'cours']))
            ->assertInertia(fn (Assert $page) => $page->where('initialTab', 'cours'));
    }

    public function test_catalog_creation_validates_the_level_and_saves_an_optional_annual_assignment_atomically(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $otherFaculty = DB::table('faculties')->insertGetId(['name' => 'Sciences', 'code' => 'SC']);
        $level = Level::create(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        LevelDetail::create(['level_id' => $level->id, 'credit_required' => 12, 'price' => 0]);
        $year = AcademicYear::create(['title' => '2026–2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $professor = Professor::create(['first_name' => 'Anne', 'last_name' => 'Mbemba', 'email' => 'catalogue@example.test', 'is_active' => true]);
        $store = route('dashboard.admin.course-catalog.store');
        $index = route('dashboard.admin.course-catalog.index');
        $payload = [
            'faculty_id' => $faculty, 'level_id' => $level->id, 'title' => 'Droit civil',
            'credits' => 4, 'semester' => 1, 'td_hours' => 12,
        ];

        $this->actingAs(User::factory()->create())->post($store, $payload)->assertForbidden();
        $this->actingAs($admin)->from($index)->post($store, array_replace($payload, ['faculty_id' => $otherFaculty]))
            ->assertSessionHasErrors('level_id');
        $this->from($index)->post($store, $payload + ['professor_id' => $professor->id])->assertSessionHasErrors('academic_year_id');
        $this->from($index)->post($store, array_replace($payload, ['credits' => 13]))->assertSessionHasErrors('credits');
        $this->assertDatabaseCount('courses', 0);

        $this->post($store, $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('courses', ['level_id' => $level->id, 'title' => 'Droit civil', 'td_hours' => 12]);
        $this->assertDatabaseCount('academic_offerings', 0);

        $assignment = ['professor_id' => $professor->id, 'academic_year_id' => $year->id];
        $this->post($store, array_replace($payload, $assignment, ['title' => 'Droit public']))->assertSessionHasNoErrors();
        $courseId = DB::table('courses')->where('title', 'Droit public')->value('id');
        $this->assertDatabaseHas('academic_offerings', [
            'course_id' => $courseId, 'level_id' => $level->id, 'academic_year_id' => $year->id,
            'professor_id' => $professor->id, 'is_published' => false,
        ]);

        $this->mock(TeachingAssignmentService::class, function ($mock) {
            $mock->shouldReceive('save')->once()->andThrow(ValidationException::withMessages(['professor_id' => 'Affectation impossible.']));
        });
        $this->from($index)->post($store, array_replace($payload, $assignment, ['title' => 'Droit administratif']))
            ->assertSessionHasErrors('professor_id');
        $this->assertDatabaseMissing('courses', ['title' => 'Droit administratif']);
    }
}
