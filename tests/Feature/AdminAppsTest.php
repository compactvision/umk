<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminAppsTest extends TestCase
{
    use RefreshDatabase;

    private function user(bool $admin): User
    {
        $user = new User;
        $user->forceFill(['first_name' => 'Test', 'last_name' => 'Admin', 'email' => $admin ? 'admin@example.test' : 'student@example.test', 'password' => 'test-password', 'email_verified_at' => now()])->save();
        if ($admin) $user->assignRole(Role::findOrCreate('admin', 'web'));
        return $user;
    }

    public function test_course_creation_is_scoped_to_the_open_level(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $other = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 2', 'code' => 'L2']);
        \App\Models\LevelDetail::create(['level_id' => $level, 'credit_required' => 60]);
        $admin = $this->user(true);
        $admin->givePermissionTo(\Spatie\Permission\Models\Permission::findOrCreate('publish academic content', 'web'));

        $this->actingAs($admin)->from('/dashboard/admin/levels/details/'.$level)
            ->post('/dashboard/admin/levels/details/'.$level.'/courses', [
                'level_id' => $other, 'title' => 'Droit civil', 'code' => 'DR101', 'credits' => 3, 'semester' => 1,
            ])->assertRedirect('/dashboard/admin/levels/details/'.$level)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('courses', ['title' => 'Droit civil', 'level_id' => $level]);
        $this->get('/dashboard/admin/levels/details/'.$other)->assertInertia(fn (Assert $page) => $page->has('courses', 0));
        $this->get('/dashboard/admin/levels/details/'.$level)->assertInertia(fn (Assert $page) => $page
            ->has('courses', 1)->where('courses.0.title', 'Droit civil')->where('courses.0.semester', 1));
        $courseId = DB::table('courses')->where('level_id', $level)->value('id');
        $this->put('/dashboard/admin/levels/details/'.$other.'/courses/'.$courseId, ['title' => 'Droit civil', 'credits' => 3, 'semester' => 2])->assertNotFound();
        $this->put('/dashboard/admin/levels/details/'.$level.'/courses/'.$courseId, ['title' => 'Droit civil', 'credits' => 3, 'semester' => 3])->assertSessionHasErrors('semester');
        $this->put('/dashboard/admin/levels/details/'.$level.'/courses/'.$courseId, ['title' => 'Droit civil', 'credits' => 3, 'semester' => 2])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('courses', ['id' => $courseId, 'semester' => 2]);
        $detailId = \App\Models\LevelDetail::where('level_id', $level)->value('id');
        $this->put('/dashboard/admin/levels/details/'.$detailId, ['level_id' => $level, 'credit_required' => 2])->assertSessionHasErrors('credit_required');
        $this->post('/dashboard/admin/levels/details/'.$level.'/courses', ['title' => 'Crédits en trop', 'credits' => 60, 'semester' => 1])->assertSessionHasErrors('credits');
        $this->actingAs($this->user(false))->post('/dashboard/admin/levels/details/'.$level.'/courses', [
            'title' => 'Interdit', 'credits' => 3,
        ])->assertForbidden();
    }

    public function test_all_four_apps_open_for_an_admin(): void
    {
        $this->actingAs($this->user(true));
        foreach (['academic-years' => 'academicYear', 'faculties' => 'faculties', 'levels' => 'levels', 'posts' => 'blog'] as $path => $page) {
            $this->get('/dashboard/admin/' . $path)->assertOk()->assertInertia(fn (Assert $response) => $response->component('dashboard/' . $page . '/Index'));
        }
    }

    public function test_levels_app_lists_all_faculties_without_a_fixed_faculty_id(): void
    {
        $first = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $second = DB::table('faculties')->insertGetId(['name' => 'Médecine', 'code' => 'MED']);
        DB::table('levels')->insert(['faculty_id' => $second, 'title' => 'Licence 1', 'code' => 'L1']);
        $this->actingAs($this->user(true))->get('/dashboard/admin/levels')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('faculties.data', 2)
            ->where('faculties.data.0.id', $first)
            ->where('faculties.data.1.id', $second)
            ->where('faculties.data.1.levels.0.title', 'Licence 1')
        );
    }

    public function test_student_cannot_access_apps(): void
    {
        $this->actingAs($this->user(false))->get('/dashboard/admin/levels')->assertForbidden();
    }
    public function test_level_details_open_without_admission_conditions(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);

        $this->actingAs($this->user(true))->get('/dashboard/admin/levels/details/'.$level)
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/levels/Show')
                ->where('levelDetail.level_id', $level)
                ->has('admissionConditions', 0));
    }

    public function test_direct_level_url_opens_the_complete_existing_screen_with_the_requested_tab(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $other = DB::table('faculties')->insertGetId(['name' => 'Médecine', 'code' => 'MED']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $admin = $this->user(true);
        $admin->givePermissionTo(\Spatie\Permission\Models\Permission::findOrCreate('publish academic content', 'web'));
        DB::table('courses')->insert(['level_id' => $level, 'title' => 'Ancien cours', 'catalog_status' => 'archived', 'credits' => 3]);
        $legacy = route('dashboard.admin.levels.show', ['id' => $level, 'tab' => 'cours']);
        $details = route('dashboard.admin.levels.details.show', ['id' => $level, 'tab' => 'cours']);

        $this->actingAs($admin)->get($legacy)->assertRedirect($details);
        $this->get($details)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/levels/Show')->where('levelDetail.level_id', $level)
            ->where('initialTab', 'cours')->where('canManageCourses', true)->where('courses.0.catalog_status', 'archived'));
        $professors = route('dashboard.admin.levels.details.show', ['id' => $level, 'tab' => 'prof']);
        $this->get(route('dashboard.admin.levels.show', ['id' => $level, 'tab' => 'prof']))->assertRedirect($professors);
        $this->get($professors)->assertOk()->assertInertia(fn (Assert $page) => $page->where('initialTab', 'prof'));
        $this->get(route('dashboard.admin.levels.show', ['id' => $level + 1]))->assertNotFound();
        $this->delete('/dashboard/admin/levels/details/'.$level)->assertMethodNotAllowed();
        $this->assertDatabaseHas('level_details', ['level_id' => $level]);

        $admin->academicFaculties()->attach($other);
        $this->get($details)->assertOk()->assertInertia(fn (Assert $page) => $page->where('canManageCourses', false));
        $this->post(route('dashboard.admin.levels.details.courses.store', $level), [])->assertForbidden();
        $this->actingAs($this->user(false))->get($legacy)->assertForbidden();
    }

    public function test_level_details_serialize_matching_admission_conditions(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $otherFaculty = DB::table('faculties')->insertGetId(['name' => 'Médecine', 'code' => 'MED']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        DB::table('admission_conditions')->insert([
            ['faculty_id' => $faculty, 'level_id' => $level, 'title' => 'Diplôme', 'section' => 'academic_info', 'is_required' => true],
            ['faculty_id' => null, 'level_id' => $level, 'title' => 'Identité', 'section' => 'personal_info', 'is_required' => true],
            ['faculty_id' => $otherFaculty, 'level_id' => $level, 'title' => 'Autre faculté', 'section' => 'academic_info', 'is_required' => false],
        ]);

        $this->actingAs($this->user(true))->get('/dashboard/admin/levels/details/'.$level)
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/levels/Show')
                ->has('admissionConditions', 2)
                ->where('admissionConditions.0.title', 'Identité')
                ->where('admissionConditions.1.title', 'Diplôme')
                ->where('admissionConditions.1.is_required', true));
    }

    public function test_failed_program_illustration_replacement_keeps_the_existing_image(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $detail = \App\Models\LevelDetail::create(['level_id' => $level, 'illustration_image' => 'level_illustrations/original.webp']);
        $this->mock(\App\Services\ImageService::class, function ($mock) {
            $mock->shouldNotReceive('delete');
            $mock->shouldReceive('resizeAndStore')->once()->andThrow(new \RuntimeException('Stockage indisponible'));
        });
        $this->actingAs($this->user(true))->put(route('dashboard.admin.levels.details.update', $detail->id), [
            'level_id' => $level, 'duration_years' => 3,
            'illustration_image' => \Illuminate\Http\UploadedFile::fake()->image('illustration.png'),
        ])->assertSessionHasErrors('illustration_image');
        $this->assertDatabaseHas('level_details', ['id' => $detail->id, 'illustration_image' => 'level_illustrations/original.webp']);
    }

    public function test_level_can_be_renamed_and_its_cover_updated_from_details(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Ancien titre', 'code' => 'L1', 'image' => 'levels/original.jpg']);
        $this->mock(\App\Services\ImageService::class, function ($mock) {
            $mock->shouldReceive('delete')->once()->with('levels/original.jpg');
            $mock->shouldReceive('resizeAndStore')->once()->andReturn('levels/nouvelle-couverture.webp');
        });

        $this->actingAs($this->user(true))->post('/dashboard/admin/levels/'.$level, [
            '_method' => 'PUT', 'faculty_id' => $faculty, 'title' => 'Licence en droit',
            'code' => 'L1', 'tag' => 'Cycle de licence', 'description' => 'Présentation mise à jour',
            'is_active' => true, 'image' => \Illuminate\Http\UploadedFile::fake()->image('couverture.jpg'),
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->get('/dashboard/admin/levels/details/'.$level)->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('level.id', $level)
                ->where('level.title', 'Licence en droit')
                ->where('level.image', 'levels/nouvelle-couverture.webp')
                ->where('level.tag', 'Cycle de licence')
                ->where('level.is_active', true)
                ->where('levelDetail.level_title', 'Licence en droit')
                ->where('faculties.data.0.id', $faculty));
    }

    public function test_admin_can_delete_a_level_from_details_and_returns_to_levels(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        DB::table('admission_conditions')->insert(['faculty_id' => $faculty, 'level_id' => $level, 'title' => 'Diplôme', 'section' => 'academic_info']);
        $this->actingAs($this->user(true))->get('/dashboard/admin/levels/details/'.$level)->assertOk();

        $this->delete('/dashboard/admin/levels/'.$level)->assertSessionHasNoErrors()
            ->assertRedirect('/dashboard/admin/levels')->assertSessionHas('success');
        $this->assertDatabaseMissing('levels', ['id' => $level]);
        $this->assertDatabaseMissing('level_details', ['level_id' => $level]);
        $this->assertDatabaseMissing('admission_conditions', ['level_id' => $level]);
        $this->assertDatabaseHas('faculties', ['id' => $faculty]);
    }

    public function test_level_with_enrollments_cannot_be_deleted(): void
    {
        $user = $this->user(true);
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        DB::table('enrollments')->insert(['uuid' => (string) \Illuminate\Support\Str::uuid(), 'student_id' => $user->id, 'level_id' => $level]);

        $this->actingAs($user)->from('/dashboard/admin/levels/details/'.$level)
            ->delete('/dashboard/admin/levels/'.$level)
            ->assertRedirect('/dashboard/admin/levels/details/'.$level)->assertSessionHasErrors('general');
        $this->assertDatabaseHas('levels', ['id' => $level]);
        $this->assertDatabaseHas('enrollments', ['level_id' => $level]);
    }

    public function test_level_in_use_by_an_access_rule_returns_the_modal_error(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        DB::table('academic_access_rules')->insert(['level_id' => $level, 'feature' => 'courses_view', 'mode' => 'full']);
        $details = route('dashboard.admin.levels.details.show', $level);

        $this->actingAs($this->user(true))->from($details)->delete(route('dashboard.admin.levels.destroy', $level))
            ->assertRedirect($details)->assertSessionHasErrors('general');
        $this->assertDatabaseHas('levels', ['id' => $level]);
    }

    public function test_student_cannot_delete_a_level(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $this->actingAs($this->user(false))->delete('/dashboard/admin/levels/'.$level)->assertForbidden();
        $this->assertDatabaseHas('levels', ['id' => $level]);
    }

    public function test_empty_faculty_can_be_deleted(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $this->actingAs($this->user(true))->delete('/dashboard/admin/faculties/'.$faculty)
            ->assertRedirect('/dashboard/admin/faculties')->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('faculties', ['id' => $faculty]);
    }

    public function test_faculty_with_levels_cannot_be_deleted(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $this->actingAs($this->user(true))->from('/dashboard/admin/faculties')
            ->delete('/dashboard/admin/faculties/'.$faculty)
            ->assertRedirect('/dashboard/admin/faculties')
            ->assertSessionHasErrors(['general' => 'Suppression impossible : cette faculté contient 1 niveau(x) de formation. Supprimez ou réaffectez ces niveaux avant de supprimer la faculté.']);
        $this->assertDatabaseHas('faculties', ['id' => $faculty]);
        $this->assertDatabaseHas('levels', ['id' => $level]);
    }

    public function test_faculty_with_enrollments_reports_the_enrollment_blocker(): void
    {
        $admin = $this->user(true);
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        DB::table('enrollments')->insert(['uuid' => (string) \Illuminate\Support\Str::uuid(), 'student_id' => $admin->id, 'level_id' => $level]);
        $this->actingAs($admin)->from('/dashboard/admin/faculties')
            ->delete('/dashboard/admin/faculties/'.$faculty)
            ->assertRedirect('/dashboard/admin/faculties')
            ->assertSessionHasErrors(['general' => 'Suppression impossible : cette faculté possède des niveaux liés à 1 inscription(s). Les niveaux et les inscriptions doivent être conservés.']);
        $this->assertDatabaseHas('faculties', ['id' => $faculty]);
        $this->assertDatabaseHas('levels', ['id' => $level]);
        $this->assertDatabaseHas('enrollments', ['level_id' => $level]);
    }

    public function test_faculty_details_include_only_its_levels(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $other = DB::table('faculties')->insertGetId(['name' => 'Médecine', 'code' => 'MED']);
        $first = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence droit', 'code' => 'L1', 'is_active' => true]);
        $second = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence droit 2', 'code' => 'L2', 'is_active' => false]);
        DB::table('levels')->insert(['faculty_id' => $other, 'title' => 'Médecine uniquement', 'code' => 'L1']);

        $this->actingAs($this->user(true))->get('/dashboard/admin/faculties/'.$faculty)->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/faculties/Show')
                ->where('faculty.id', $faculty)
                ->where('faculty.name', 'Droit')
                ->has('faculty.levels', 2)
                ->where('faculty.levels.0.id', $first)
                ->where('faculty.levels.1.id', $second)
                ->missing('faculties'));
    }

    public function test_missing_faculty_returns_not_found(): void
    {
        $this->actingAs($this->user(true))->get('/dashboard/admin/faculties/99999')->assertNotFound();
    }

    public function test_year_details_scope_enrollment_counts_and_list_to_selected_year(): void
    {
        $admin = $this->user(true);
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = DB::table('academic_years')->insertGetId(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $other = DB::table('academic_years')->insertGetId(['title' => '2025-2026', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30', 'status' => 'closed']);
        foreach ([[$year, 'validated', null], [$year, 'submitted', null], [$year, 'pending', null], [$year, 'draft', null], [$year, 'validated', now()], [$other, 'validated', null]] as [$yearId, $status, $deleted]) {
            DB::table('enrollments')->insert(['uuid' => (string) \Illuminate\Support\Str::uuid(), 'student_id' => $admin->id, 'level_id' => $level, 'academic_year_id' => $yearId, 'status' => $status, 'deleted_at' => $deleted]);
        }
        $this->actingAs($admin)->get('/dashboard/admin/academic-years/'.$year)->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/academicYear/Show')
                ->where('academicYear.data.id', $year)
                ->where('enrollmentStats.total', 4)
                ->where('enrollmentStats.validated', 1)
                ->where('enrollmentStats.pending', 2)
                ->where('enrollmentStats.draft', 1)
                ->has('enrollments.data', 4)
                ->missing('enrollments.data.0.form_snapshot')
                ->missing('enrollments.data.0.meta'));
    }

    public function test_year_edit_and_closure_return_to_details_without_deleting_enrollments(): void
    {
        $admin = $this->user(true);
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = DB::table('academic_years')->insertGetId(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        DB::table('enrollments')->insert(['uuid' => (string) \Illuminate\Support\Str::uuid(), 'student_id' => $admin->id, 'level_id' => $level, 'academic_year_id' => $year, 'status' => 'validated']);
        $url = '/dashboard/admin/academic-years/'.$year;
        $this->actingAs($admin)->from($url)->put($url, ['title' => 'Année 2026-2027', 'start_date' => '2026-10-15', 'end_date' => '2027-09-30'])->assertSessionHasNoErrors()->assertRedirect($url);
        $this->from($url)->patch($url.'/close')->assertSessionHasNoErrors()->assertRedirect($url);
        $this->assertDatabaseHas('academic_years', ['id' => $year, 'title' => 'Année 2026-2027', 'status' => 'closed']);
        $this->assertDatabaseHas('enrollments', ['academic_year_id' => $year, 'status' => 'validated']);
    }

    public function test_public_faculty_page_only_exposes_active_levels_of_that_faculty(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR', 'is_active' => true]);
        $other = DB::table('faculties')->insertGetId(['name' => 'Médecine', 'code' => 'MED', 'is_active' => true]);
        $active = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence droit', 'code' => 'L1', 'is_active' => true]);
        DB::table('levels')->insert(['faculty_id' => $faculty, 'title' => 'Brouillon confidentiel', 'code' => 'L2', 'is_active' => false]);
        DB::table('levels')->insert(['faculty_id' => $other, 'title' => 'Autre faculté', 'code' => 'L1', 'is_active' => true]);
        DB::table('level_details')->insert(['level_id' => $active, 'duration_years' => 1, 'student_number' => 99, 'price' => 123, 'language' => 'Français']);
        $this->get('/faculties/'.$faculty)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('faculties/FacultyShow')
            ->where('faculty.id', $faculty)
            ->has('faculty.levels', 1)
            ->where('faculty.levels.0.id', $active)
            ->where('faculty.levels.0.detail.language', 'Français')
            ->missing('faculty.levels.0.detail.student_number')
            ->missing('faculty.levels.0.detail.price')
            ->has('otherFaculties', 1)
            ->where('otherFaculties.0.id', $other));
    }

    public function test_public_faculty_page_handles_no_active_levels_and_rejects_inactive_faculties(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR', 'is_active' => true]);
        $inactive = DB::table('faculties')->insertGetId(['name' => 'Théologie', 'code' => 'THEO', 'is_active' => false]);
        $this->get('/faculties/'.$faculty)->assertOk()->assertInertia(fn (Assert $page) => $page->has('faculty.levels', 0));
        $this->get('/faculties/'.$inactive)->assertNotFound();
        $this->get('/faculties/99999')->assertNotFound();
    }

    public function test_public_course_shows_programme_and_only_applicable_admission_conditions(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR', 'is_active' => true]);
        $other = DB::table('faculties')->insertGetId(['name' => 'Médecine', 'code' => 'MED', 'is_active' => true]);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence droit', 'code' => 'L1', 'is_active' => true]);
        DB::table('level_details')->insert(['level_id' => $level, 'course_objective' => 'Analyser le droit', 'student_number' => 70, 'language' => 'Français']);
        foreach ([[$faculty, 'Diplôme'], [null, 'Identité'], [$other, 'Condition autre faculté']] as [$facultyId, $title]) {
            DB::table('admission_conditions')->insert(['faculty_id' => $facultyId, 'level_id' => $level, 'title' => $title, 'section' => 'academic_info']);
        }
        $this->get('/course/'.$level)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('courses/CourseShow')
            ->where('course.title', 'Licence droit')
            ->where('course.faculty.id', $faculty)
            ->where('course.detail.course_objective', 'Analyser le droit')
            ->has('course.admission_conditions', 2)
            ->where('course.admission_conditions.0.title', 'Diplôme')
            ->where('course.admission_conditions.1.title', 'Identité')
            ->missing('course.detail.student_number'));
    }

    public function test_public_course_rejects_inactive_faculties_and_levels_and_filters_recommendations(): void
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR', 'is_active' => true]);
        $hiddenFaculty = DB::table('faculties')->insertGetId(['name' => 'Théologie', 'code' => 'THEO', 'is_active' => false]);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence droit', 'code' => 'L1', 'is_active' => true]);
        $hidden = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Brouillon', 'code' => 'L2', 'is_active' => false]);
        $hiddenByFaculty = DB::table('levels')->insertGetId(['faculty_id' => $hiddenFaculty, 'title' => 'Théologie', 'code' => 'L1', 'is_active' => true]);
        $this->get('/course/'.$hidden)->assertNotFound();
        $this->get('/course/'.$hiddenByFaculty)->assertNotFound();
        $this->get('/course/'.$level)->assertOk()->assertInertia(fn (Assert $page) => $page->has('mayLike', 0));
    }

}
