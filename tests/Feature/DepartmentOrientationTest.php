<?php

namespace Tests\Feature;

use App\Models\AcademicStructure\AcademicDepartment;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\User;
use App\Modules\Student\Application\Services\StudentAdmissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class DepartmentOrientationTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    public function test_configured_choices_separate_courses_rooms_and_attendance_while_preserving_common_teaching(): void
    {
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->firstOrFail();
        $level = $entry->level;
        $institution = University::create(['context_key' => 'current', 'code' => 'UNI', 'name' => 'Université']);
        $level->faculty->forceFill(['university_id' => $institution->id])->save();
        $chirurgie = AcademicDepartment::create(['faculty_id' => $level->faculty_id, 'code' => 'CHIR', 'name' => 'Chirurgie', 'is_active' => true]);
        $pediatrie = AcademicDepartment::create(['faculty_id' => $level->faculty_id, 'code' => 'PED', 'name' => 'Pédiatrie', 'is_active' => true]);
        $unavailable = AcademicDepartment::create(['faculty_id' => $level->faculty_id, 'code' => 'INACT', 'name' => 'Inactif', 'is_active' => false]);
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $config = route('dashboard.admin.academic-structure.department-options.update', $level->id);
        $portal = '/dashboard/student/overview?academic='.$entry->id;
        $choose = '/dashboard/student/department?academic='.$entry->id;
        $this->actingAs($student)->get($portal)->assertInertia(fn (Assert $p) => $p->has('department_options', 0));
        $this->put($config, ['department_ids' => [$chirurgie->id]])->assertForbidden();
        $this->actingAs($admin)->put($config, ['department_ids' => [$unavailable->id]])->assertSessionHasErrors('department_ids');
        $this->put($config, ['department_ids' => [$chirurgie->id, $pediatrie->id]])->assertRedirect();
        $this->get('/dashboard/admin/faculties')->assertInertia(fn (Assert $p) => $p->has('faculties.0.levels.0.department_options', 2));

        $offerings = collect([
            ['Anatomie', null], ['Techniques chirurgicales', $chirurgie->id], ['Pédiatrie clinique', $pediatrie->id],
        ])->map(function ($definition) use ($entry) {
            [$title, $department] = $definition;
            $course = Courses::forceCreate(['level_id' => $entry->level_id, 'title' => $title, 'credits' => 3, 'semester' => 1]);
            $this->post('/dashboard/admin/student-academic/offerings', [
                'course_id' => $course->id, 'academic_year_id' => $entry->academic_year_id,
                'academic_department_id' => $department, 'is_published' => true,
            ])->assertSessionHasNoErrors();

            return AcademicOffering::where('course_id', $course->id)->firstOrFail();
        });
        [$common, $surgery, $pediatrics] = $offerings->all();
        AcademicSemester::create(['academic_year_id' => $entry->academic_year_id, 'number' => 1, 'start_date' => '2026-10-01', 'end_date' => '2027-03-31']);
        $slot = fn ($offering, $room) => ['academic_offering_id' => $offering->id, 'starts_at' => '2026-11-02T08:00', 'ends_at' => '2026-11-02T10:00', 'room' => $room, 'is_published' => true, 'repeat_count' => 1];
        $this->post('/dashboard/admin/schedule', $slot($surgery, 'Salle chirurgie'))->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/schedule', $slot($pediatrics, 'Salle chirurgie'))->assertSessionHasErrors('starts_at');
        $this->post('/dashboard/admin/schedule', $slot($pediatrics, 'Salle pédiatrie'))->assertSessionHasNoErrors();
        $this->post('/dashboard/admin/schedule', $slot($common, 'Amphithéâtre'))->assertSessionHasErrors('starts_at');

        $this->actingAs($student)->get($portal)->assertInertia(fn (Assert $p) => $p->has('department_options', 2)->has('courses', 1)->where('courses.0.course_id', $common->course_id));
        $this->post($choose, ['academic_department_id' => $unavailable->id])->assertSessionHasErrors('academic_department_id');
        $this->post($choose, ['academic_department_id' => $chirurgie->id])->assertRedirect($portal);
        $this->post($choose, ['academic_department_id' => $pediatrie->id])->assertSessionHasErrors('academic_department_id');
        $this->get($portal)->assertInertia(fn (Assert $p) => $p->where('department.name', 'Chirurgie')->has('department_options', 0)->has('courses', 2));
        $this->get('/dashboard/student/courses/'.$pediatrics->course_id.'?academic='.$entry->id)->assertNotFound();
        $this->get('/dashboard/student/schedule?academic='.$entry->id.'&week=2026-11-02')
            ->assertInertia(fn (Assert $p) => $p->has('sessions', 1)->where('sessions.0.room', 'Salle chirurgie'));

        $directory = '/dashboard/admin/student-academic?'.http_build_query([
            'tab' => 'students', 'view' => 'grid', 'faculty' => $level->faculty_id,
            'department' => $chirurgie->id, 'level' => $level->id,
        ]);
        $this->actingAs($admin)->get($directory)
            ->assertInertia(fn (Assert $p) => $p->where('filters.view', 'grid')->has('students.data', 1)
                ->where('students.data.0.id', $entry->id)->where('students.data.0.department', 'Chirurgie'));
        $this->get('/dashboard/admin/schedule/'.$pediatrics->sessions()->firstOrFail()->id.'/attendance')
            ->assertInertia(fn (Assert $p) => $p->has('students', 0));
        $this->get('/dashboard/admin/schedule/'.$surgery->sessions()->firstOrFail()->id.'/attendance')
            ->assertInertia(fn (Assert $p) => $p->has('students', 1)->where('students.0.id', $entry->id));
        $this->put($config, ['department_ids' => [$pediatrie->id]])->assertSessionHasErrors('department_ids');

        $nextLevel = Level::create(['faculty_id' => $level->faculty_id, 'code' => 'L4', 'title' => 'Niveau suivant']);
        $this->put(route('dashboard.admin.academic-structure.department-options.update', $nextLevel->id), [
            'department_ids' => [$chirurgie->id, $pediatrie->id],
        ])->assertSessionHasNoErrors();
        $year = AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'open']);
        $next = Enrollment::create(['student_id' => $student->id, 'level_id' => $nextLevel->id, 'academic_year_id' => $year->id, 'status' => 'validated', 'meta' => ['required_documents' => []]]);
        $this->assertEquals($chirurgie->id, app(StudentAdmissionService::class)->activate($next, $admin->id, false)->academic_department_id);
    }
}
