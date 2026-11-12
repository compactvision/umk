<?php

namespace Tests\Feature;

use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Enrollment;
use App\Models\Professor;
use App\Models\Intake;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSession;
use App\Models\Student\AccessRule;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Modules\AcademicStructure\Application\Services\StructureService;
use App\Modules\AcademicYear\Application\UseCases\CloseAcademicYear;
use App\Modules\AcademicYear\Application\UseCases\OpenAcademicYear;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Enrollment\Domain\Services\EnrollmentValidator;
use App\Modules\Student\Application\Services\StudentAdmissionService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class AcademicStructureTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private function context(): array
    {
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->firstOrFail();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $service = app(StructureService::class);
        $common = ['revision' => 0, 'reason' => 'Configuration académique approuvée.', 'is_active' => true];
        $uni = $service->save('university', $common + ['code' => 'UNI', 'name' => 'Université de test'], $admin);
        $entry->level->faculty->forceFill(['university_id' => $uni->id])->save();
        $entry->academicYear->forceFill(['university_id' => $uni->id])->save();
        $cycle = $service->save('cycle', $common + ['code' => 'CUSTOM', 'name' => 'Cycle configurable', 'normal_duration' => 4, 'progression_mode' => 'custom', 'weighting_mode' => 'both', 'periods' => [['code' => 'P1', 'name' => 'Période personnalisée']]], $admin);
        $program = $service->save('program', $common + ['code' => 'PROGRAM', 'name' => 'Programme de test', 'faculty_id' => $entry->level->faculty_id, 'academic_cycle_id' => $cycle->id, 'level_ids' => [$entry->level_id]], $admin);
        $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'code' => 'TEST101', 'title' => 'Titre initial', 'credits' => 3, 'semester' => 1, 'cmi_hours' => 20, 'td_hours' => 10, 'tp_hours' => 0]);
        $course->save();

        return [$admin, $student, $entry, $program, $course];
    }

    private function draft(array $context, string $code = 'V1', array $scope = []): CurriculumVersion
    {
        [$admin,, $entry, $program] = $context;

        return app(CurriculumService::class)->draft(['academic_program_id' => $program->id, 'code' => $code, 'name' => 'Maquette '.$code, 'reason' => 'Préparation de la maquette.'] + ($scope ?: ['academic_year_id' => $entry->academic_year_id]), $admin);
    }

    private function content(array $context, int $credits = 3): array
    {
        [,,$entry,,$course] = $context;

        return [['level_id' => $entry->level_id, 'period_code' => 'P1', 'code' => 'UE1', 'name' => 'Unité de référence', 'expected_credits' => $credits, 'items' => [['source_course_id' => $course->id, 'credits' => $credits, 'coefficient' => 2, 'cmi_hours' => 20, 'td_hours' => 10, 'tp_hours' => 0]]]];
    }

    private function published(array $context, string $code = 'V1', array $scope = []): CurriculumVersion
    {
        $service = app(CurriculumService::class);
        $v = $this->draft($context, $code, $scope);
        $v = $service->saveDraft($v->id, ['revision' => 0, 'reason' => 'Contenu académique préparé.', 'units' => $this->content($context)], $context[0]);
        $this->approveLevel($v, $context);
        $v = $service->transition($v->id, 'validate', $v->revision, 'Vérification académique complète.', $context[0]);

        return $service->transition($v->id, 'publish', $v->revision, 'Publication approuvée par l’institution.', $context[0]);
    }

    private function approveLevel(CurriculumVersion $version, array $context): void
    {
        [$admin,, $entry, $program] = $context;
        $service = app(CurriculumService::class);
        $level = collect($service->levelWorkspace($version->fresh(), $program))->firstWhere('id', $entry->level_id);
        $service->approveLevel($version->id, $entry->level_id, $version->revision, $level['signature'], $admin);
    }

    public function test_dossier_calculates_average_and_credits_from_the_enrollments_unit_results(): void
    {
        $context = $this->context();
        [$admin, $student, $entry] = $context;
        $otherCourse = (new Courses)->forceFill(['level_id' => $entry->level_id, 'code' => 'TEST102', 'title' => 'Deuxième cours', 'credits' => 5, 'semester' => 1]);
        $otherCourse->save();
        $units = $this->content($context);
        $units[] = array_replace($units[0], [
            'code' => 'UE2', 'name' => 'Deuxième unité', 'expected_credits' => 5,
            'items' => [array_replace($units[0]['items'][0], ['source_course_id' => $otherCourse->id, 'credits' => 5])],
        ]);
        $service = app(CurriculumService::class);
        $version = $this->draft($context);
        $version = $service->saveDraft($version->id, ['revision' => 0, 'reason' => 'Préparation des unités.', 'units' => $units], $admin);
        $this->approveLevel($version, $context);
        $version = $service->transition($version->id, 'validate', $version->revision, 'Validation des unités.', $admin);
        $version = $service->transition($version->id, 'publish', $version->revision, 'Publication des unités.', $admin);
        $service->bind($version->id, $entry->id, $admin, 'Rattachement de cette inscription.');
        [$first, $second] = $version->units()->pluck('id')->all();
        $url = '/dashboard/admin/student-academic/'.$entry->id;
        $firstUrl = $url.'/unit-results/'.$first;
        $secondUrl = $url.'/unit-results/'.$second;

        $this->actingAs($student)->put($firstUrl, ['score' => 12, 'validated' => true])->assertForbidden();
        $this->actingAs($admin)->put($firstUrl, ['score' => 21, 'validated' => true])->assertSessionHasErrors('score');
        $this->put($firstUrl, ['score' => 14.5, 'validated' => true])->assertSessionHasNoErrors();
        $this->get($url.'?section='.urlencode('Académique'))->assertInertia(fn (Assert $page) => $page
            ->where('dossier.unitResults.average', 14.5)->where('dossier.unitResults.earnedCredits', 3)
            ->where('dossier.unitResults.requiredCredits', 8)->where('dossier.unitResults.units.1.score', null));

        $this->put($secondUrl, ['score' => 0, 'validated' => false])->assertSessionHasNoErrors();
        $this->get($url.'?section='.urlencode('Académique'))->assertInertia(fn (Assert $page) => $page
            ->where('dossier.unitResults.average', 7.25)->where('dossier.unitResults.earnedCredits', 3)
            ->where('dossier.unitResults.units.1.score', 0)->where('dossier.unitResults.units.1.validated', false));
    }

    public function test_calendar_exam_is_visible_in_the_students_schedule_and_overview_for_its_week(): void
    {
        [$admin, $student, $entry] = $this->context();
        $this->travelTo(\Carbon\CarbonImmutable::parse('2026-11-09 00:30', 'Africa/Kinshasa'));
        $this->actingAs($admin)->post(route('dashboard.admin.academic-years.calendar.store', $entry->academic_year_id), [
            'title' => 'Examens communs', 'category' => 'exam',
            'start_date' => '2026-11-09', 'end_date' => '2026-11-09',
        ])->assertSessionHasNoErrors();

        foreach (['schedule', 'overview'] as $section) {
            $this->actingAs($student)->get("/dashboard/student/{$section}?academic={$entry->id}")
                ->assertInertia(fn (Assert $page) => $page->where('schedule_week', '2026-11-09')
                    ->has('sessions', 0)->has('calendar_events', 1)
                    ->where('calendar_events.0.title', 'Examens communs')
                    ->where('calendar_events.0.start_date', '2026-11-09'));
        }
        $this->get('/dashboard/student/schedule?academic='.$entry->id.'&week=2026-11-16')
            ->assertInertia(fn (Assert $page) => $page->has('calendar_events', 0));
    }

    public function test_annual_draft_correction_and_publication_reach_the_student_timetable(): void
    {
        $context = $this->context();
        [$admin, $student, $entry, $program, $course] = $context;
        $course->forceFill(['cmi_hours' => 2, 'td_hours' => 0])->save();
        AcademicSemester::create([
            'academic_year_id' => $entry->academic_year_id, 'number' => 1,
            'start_date' => '2026-11-09', 'end_date' => '2026-11-13',
        ]);
        $teacher = Professor::create(['first_name' => 'Anne', 'last_name' => 'Professeur', 'email' => 'anne@example.test', 'is_active' => true]);
        $offering = AcademicOffering::create([
            'course_id' => $course->id, 'level_id' => $entry->level_id,
            'academic_year_id' => $entry->academic_year_id, 'professor_id' => $teacher->id,
        ]);
        $studentUrl = '/dashboard/student/schedule?academic='.$entry->id.'&week=2026-11-09';

        $this->actingAs($admin)->post(route('dashboard.admin.academic-structure.versions.annual-batch'), [
            'academic_year_id' => $entry->academic_year_id, 'rooms' => ['Salle initiale'],
        ])->assertSessionHasNoErrors()->assertSessionHas('annualBatch.rows.0.schedule.sessions', 1);
        $version = $program->versions()->sole();
        $session = $offering->sessions()->sole();
        $this->assertFalse($session->is_published);
        $this->assertSame('Salle initiale', $session->room);
        $this->actingAs($student)->get($studentUrl)->assertOk()->assertInertia(fn (Assert $page) => $page->has('sessions', 0));

        $maquette = route('dashboard.admin.academic-structure.index', ['program' => $program->id, 'version' => $version->id]);
        $units = $this->content($context);
        $units[0]['items'][0]['cmi_hours'] = 2;
        $units[0]['items'][0]['td_hours'] = 0;
        $this->actingAs($admin)->put(route('dashboard.admin.academic-structure.versions.update', $version->id), [
            'revision' => $version->revision, 'reason' => 'Coefficient du cours vérifié.', 'units' => $units,
        ])->assertRedirect($maquette)->assertSessionHasNoErrors();
        $this->from($maquette)->put(route('dashboard.admin.schedule.update', $session->id), [
            'academic_offering_id' => $offering->id, 'starts_at' => '2026-11-11T13:00', 'ends_at' => '2026-11-11T15:00',
            'room' => 'Salle corrigée B12', 'repeat_count' => 1,
        ])->assertRedirect($maquette)->assertSessionHasNoErrors();

        $workspace = $this->get($maquette)->assertInertia(fn (Assert $page) => $page
            ->where('scheduleSemesters.0.number', 1)
            ->where('scheduleSemesters.0.start_date', '2026-11-09')
            ->where('scheduleSemesters.0.end_date', '2026-11-13')
            ->where('catalog.0.semester', $course->fresh()->semester)
            ->where('levelWorkspace.0.approved', false)
            ->where('levelWorkspace.0.schedule.0.sessions.0.room', 'Salle corrigée B12'));
        $this->post(route('dashboard.admin.academic-structure.versions.levels.approve', [$version->id, $entry->level_id]), [
            'revision' => $version->fresh()->revision, 'signature' => $workspace->viewData('page')['props']['levelWorkspace'][0]['signature'],
        ])->assertRedirect($maquette)->assertSessionHasNoErrors();
        $transition = route('dashboard.admin.academic-structure.versions.transition', $version->id);
        $this->post($transition, ['action' => 'validate', 'revision' => $version->fresh()->revision, 'reason' => 'Matières et horaire vérifiés.'])
            ->assertRedirect($maquette)->assertSessionHasNoErrors();
        $this->post($transition, ['action' => 'publish', 'revision' => $version->fresh()->revision, 'reason' => 'Publication de la maquette et des séances.'])
            ->assertRedirect($maquette)->assertSessionHasNoErrors();

        $this->assertSame('published', $version->fresh()->status);
        $this->actingAs($student)->get($studentUrl)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/student/Portal')->where('section', 'schedule')->has('sessions', 1)
            ->where('sessions.0.id', $session->id)->where('sessions.0.room', 'Salle corrigée B12')
            ->where('sessions.0.starts_at', '2026-11-11T12:00:00.000000Z')
            ->where('sessions.0.ends_at', '2026-11-11T14:00:00.000000Z'));
    }

    public function test_level_review_is_required_and_timetable_changes_require_a_new_review(): void
    {
        $context = $this->context();
        [$admin, $student, $entry, $program, $course] = $context;
        $service = app(CurriculumService::class);
        $version = $this->draft($context);
        $version = $service->saveDraft($version->id, ['revision' => 0, 'reason' => 'Préparation du niveau.', 'units' => $this->content($context)], $admin);
        $this->refused(fn () => $service->transition($version->id, 'validate', $version->revision, 'Validation de la maquette.', $admin), 'levels');

        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id]);
        $session = $offering->sessions()->create(['starts_at' => '2026-11-09 08:00:00', 'ends_at' => '2026-11-09 10:00:00', 'room' => 'Salle A', 'is_published' => false]);
        $level = $service->levelWorkspace($version->fresh(), $program)[0];
        $approve = route('dashboard.admin.academic-structure.versions.levels.approve', [$version->id, $entry->level_id]);
        $this->actingAs($admin)->post($approve, ['revision' => $version->revision, 'signature' => $level['signature']])->assertRedirect();
        $version = $service->transition($version->id, 'validate', $version->revision, 'Validation de la maquette.', $admin);
        $session->update(['room' => 'Salle B']);
        $this->refused(fn () => $service->transition($version->id, 'publish', $version->revision, 'Publication de la maquette.', $admin), 'levels');

        $this->assertFalse($session->fresh()->is_published);

        $version = $service->transition($version->id, 'reopen', $version->revision, 'Nouvelle revue après correction.', $admin);
        $this->approveLevel($version, $context);
        $version = $service->transition($version->id, 'validate', $version->revision, 'Validation après correction.', $admin);
        $version = $service->transition($version->id, 'publish', $version->revision, 'Publication de la maquette.', $admin);
        $this->assertTrue($session->fresh()->is_published);
        $this->assertTrue($offering->fresh()->is_published);
        $this->actingAs($student)->get('/dashboard/student/schedule?academic='.$entry->id.'&week=2026-11-09')
            ->assertInertia(fn (Assert $page) => $page->has('sessions', 1)->where('sessions.0.room', 'Salle B'));
        $session->update(['room' => 'Salle C']);
        $this->assertSame('Salle B', $service->levelWorkspace($version, $program)[0]['schedule'][0]['sessions'][0]['room']);
    }

    private function refused(callable $operation, string $key): void
    {
        try {
            $operation();
            $this->fail('Expected validation refusal');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey($key, $exception->errors());
        }
    }

    public function test_annual_generation_proposes_only_missing_hours_in_free_rooms_as_drafts(): void
    {
        [$admin,, $entry, $program, $course] = $this->context();
        $course->forceFill(['cmi_hours' => 3, 'td_hours' => 0])->save();
        \App\Models\Student\AcademicSemester::create([
            'academic_year_id' => $entry->academic_year_id, 'number' => 1, 'start_date' => '2026-11-09', 'end_date' => '2026-11-09',
        ]);
        $teacher = \App\Models\Professor::create(['first_name' => 'Anne', 'last_name' => 'Professeur', 'email' => 'anne@example.test', 'is_active' => true]);
        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id, 'professor_id' => $teacher->id]);
        $reserved = $offering->sessions()->create([
            'starts_at' => '2026-11-09 07:00:00', 'ends_at' => '2026-11-09 08:00:00', 'room' => 'Salle A', 'is_published' => true,
        ]);
        $otherLevel = \App\Models\Level::create(['faculty_id' => $program->faculty_id, 'title' => 'Autre niveau', 'code' => 'T2']);
        $otherCourse = Courses::forceCreate(['level_id' => $otherLevel->id, 'title' => 'Cours hors maquette', 'credits' => 2, 'semester' => 1]);
        $otherOffering = AcademicOffering::create(['course_id' => $otherCourse->id, 'level_id' => $otherLevel->id, 'academic_year_id' => $entry->academic_year_id]);
        $otherOffering->sessions()->create([
            'starts_at' => '2026-11-09 09:00:00', 'ends_at' => '2026-11-09 11:00:00', 'room' => 'salle A',
        ]);
        Courses::forceCreate(['level_id' => $entry->level_id, 'title' => 'Cours sans affectation', 'credits' => 3, 'semester' => 1, 'cmi_hours' => 2]);

        $url = '/dashboard/admin/academic-structure/versions/annual-batch';
        $payload = ['academic_year_id' => $entry->academic_year_id, 'rooms' => ['Salle A', 'Salle B']];
        $this->actingAs($admin)->post($url, $payload)
            ->assertSessionHas('annualBatch.rows.0.schedule.sessions', 1)
            ->assertSessionHas('annualBatch.rows.0.schedule.issues.0', 'Cours sans affectation · aucun enseignement affecté pour cette année.');
        $generated = $offering->sessions()->where('id', '!=', $reserved->id)->sole();
        $this->assertSame('2026-11-09 09:00:00', $generated->starts_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-11-09 11:00:00', $generated->ends_at->format('Y-m-d H:i:s'));
        $this->assertSame('Salle B', $generated->room);
        $this->assertFalse($generated->is_published);
        $this->assertTrue($reserved->fresh()->is_published);

        $this->post($url, $payload)->assertSessionHas('annualBatch.rows.0.schedule.sessions', 0);
        $this->assertSame(2, $offering->sessions()->count());
        $this->assertSame('draft', $program->versions()->sole()->status);
    }

    public function test_annual_batch_generates_each_configured_faculty_once_and_reports_missing_programs(): void
    {
        [$admin, $student, $entry, $first] = $this->context();
        $faculty = \App\Models\Faculty::create(['name' => 'Autre faculté', 'code' => 'AUTRE']);
        $faculty->forceFill(['university_id' => $entry->level->faculty->university_id])->save();
        $level = \App\Models\Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence 1', 'code' => 'L1']);
        $second = app(StructureService::class)->save('program', [
            'faculty_id' => $faculty->id, 'academic_cycle_id' => $first->academic_cycle_id, 'level_ids' => [$level->id],
            'code' => 'AUTRE', 'name' => 'Autre programme', 'revision' => 0, 'is_active' => true, 'reason' => 'Configuration du programme.',
        ], $admin);
        Courses::forceCreate(['level_id' => $level->id, 'title' => 'Matière de la seconde faculté', 'credits' => 7, 'semester' => 1]);
        \App\Models\Faculty::create(['name' => 'Faculté à rattacher', 'code' => 'LIBRE']);

        $url = '/dashboard/admin/academic-structure/versions/annual-batch';
        $payload = ['academic_year_id' => $entry->academic_year_id];
        $this->actingAs($student)->post($url, $payload)->assertForbidden();
        $this->actingAs($admin)->post($url, $payload)
            ->assertRedirect('/dashboard/admin/academic-structure?tab=curriculum&year='.$entry->academic_year_id)
            ->assertSessionHas('annualBatch.rows.0.status', 'created')
            ->assertSessionHas('annualBatch.rows.1.status', 'created')
            ->assertSessionHas('annualBatch.rows.2.status', 'skipped');
        $this->get('/dashboard/admin/academic-structure?tab=curriculum')->assertInertia(
            fn (Assert $page) => $page->has('annualBatch.rows', 3)->where('annualBatch.rows.1.program_id', $second->id)
        );

        $draft = $second->versions()->sole();
        $this->assertSame('draft', $draft->status);
        $item = $draft->units()->sole()->items()->sole();
        $this->assertSame('7.00', $item->credits);
        $item->update(['credits' => 8]);
        $this->post($url, $payload)
            ->assertSessionHas('annualBatch.rows.0.status', 'existing')
            ->assertSessionHas('annualBatch.rows.1.version_id', $draft->id);
        $this->assertDatabaseCount('curriculum_versions', 2);
        $this->assertSame('8.00', $item->fresh()->credits);
    }

    public function test_pack_builds_missing_programs_and_tracks_faculty_validation(): void
    {
        [$admin, , $entry] = $this->context();
        $faculty = \App\Models\Faculty::create(['name' => 'Faculté automatique', 'code' => 'AUTO']);
        $level = \App\Models\Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence 1', 'code' => 'L1', 'is_active' => true]);
        Courses::forceCreate(['level_id' => $level->id, 'title' => 'Cours à importer', 'credits' => 4, 'semester' => 2]);
        $batch = route('dashboard.admin.academic-structure.versions.annual-batch');
        $payload = ['academic_year_id' => $entry->academic_year_id];
        $this->actingAs($admin)->post($batch, $payload)->assertSessionHasNoErrors();

        $program = \App\Models\AcademicStructure\AcademicProgram::where('faculty_id', $faculty->id)->sole();
        $draft = $program->versions()->sole();
        $unit = $draft->units()->sole();
        $this->assertEquals($level->id, $unit->level_id);
        $this->assertSame('S2', $unit->period_code);
        $this->assertSame('4.00', $unit->items()->sole()->credits);

        $index = route('dashboard.admin.academic-structure.index', ['tab' => 'curriculum', 'year' => $entry->academic_year_id]);
        $this->get($index)->assertInertia(fn (Assert $page) => $page->where('facultyPack.0.approved', 0)->where('facultyPack.0.total', 1));
        $workspace = app(CurriculumService::class)->levelWorkspace($draft, $program);
        $this->post(route('dashboard.admin.academic-structure.versions.levels.approve', [$draft->id, $level->id]), [
            'revision' => $draft->revision, 'signature' => $workspace[0]['signature'],
        ])->assertSessionHasNoErrors();
        $this->get($index)->assertInertia(fn (Assert $page) => $page->where('facultyPack.0.approved', 1)->where('facultyPack.0.total', 1));

        $this->post($batch, $payload)->assertSessionHasNoErrors();
        $this->assertSame(1, $program->versions()->count());
        $this->assertSame(1, \App\Models\AcademicStructure\AcademicProgram::where('faculty_id', $faculty->id)->count());
    }

    public function test_new_annual_draft_copies_catalog_courses_for_its_levels_and_periods(): void
    {
        $context = $this->context();
        [$admin,, $entry, $program, $firstCourse] = $context;
        $program->cycle->update(['periods' => [['code' => 'P1', 'name' => 'Premier semestre'], ['code' => 'P2', 'name' => 'Second semestre']]]);
        $next = \App\Models\Level::create(['faculty_id' => $program->faculty_id, 'code' => 'T2', 'title' => 'Niveau suivant']);
        $other = \App\Models\Level::create(['faculty_id' => $program->faculty_id, 'code' => 'T3', 'title' => 'Niveau hors programme']);
        $program->levels()->attach($next->id, ['position' => 2]);
        $secondCourse = Courses::forceCreate(['level_id' => $next->id, 'title' => 'Matière du second semestre', 'credits' => 4, 'semester' => 2, 'tp_hours' => 12]);
        $fallback = Courses::forceCreate(['level_id' => $next->id, 'title' => 'Matière sans semestre', 'credits' => 1]);
        Courses::forceCreate(['level_id' => $other->id, 'title' => 'Matière hors programme', 'credits' => 5]);

        $version = $this->draft($context)->load('units.items');
        $this->assertSame('draft', $version->status);
        $this->assertEquals($entry->academic_year_id, $version->academic_year_id);
        $items = $version->units->flatMap(fn ($unit) => $unit->items)->keyBy('source_course_id');
        $this->assertCount(3, $items);
        $this->assertSame('P1', $items[$firstCourse->id]->unit->period_code);
        $this->assertSame('P1', $items[$fallback->id]->unit->period_code);
        $this->assertSame('P2', $items[$secondCourse->id]->unit->period_code);
        $this->assertSame('4.00', $items[$secondCourse->id]->credits);
        $this->assertEquals(12, $items[$secondCourse->id]->tp_hours);
        $this->assertNull($items[$secondCourse->id]->coefficient);
        $secondCourse->forceFill(['credits' => 6])->save();
        $this->assertSame('4.00', $items[$secondCourse->id]->fresh()->credits);

        $this->actingAs($admin)->get('/dashboard/admin/academic-structure?tab=curriculum&version='.$version->id)
            ->assertInertia(fn (Assert $page) => $page->has('selectedVersion.units', 3));
    }

    public function test_custom_reference_structure_and_read_page_use_existing_levels(): void
    {
        $context = $this->context();
        [$admin,,$entry,$program] = $context;
        $this->assertSame([$entry->level_id], $program->levels()->pluck('levels.id')->all());
        $this->assertDatabaseCount('levels', 1);
        $this->assertSame('custom', $program->cycle->progression_mode);
        $payload = ['faculty_id' => $program->faculty_id, 'code' => 'SCI', 'name' => 'Département de test', 'is_active' => true, 'revision' => 0, 'reason' => 'Configuration du département.'];
        $directory = '/dashboard/admin/faculties';
        $facultySelection = $directory.'?faculty='.$program->faculty_id;
        $this->actingAs($admin)->post('/dashboard/admin/academic-structure/references/department', $payload)
            ->assertRedirect($facultySelection)->assertSessionHasNoErrors();
        $this->get('/dashboard/admin/academic-structure?tab=faculties')->assertRedirect($directory);
        $this->get($facultySelection)->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/faculties/Index')
            ->where('selectedFacultyId', $program->faculty_id)
            ->where('manageStructure', true)
            ->where('faculties.0.departments.0.code', 'SCI'));
        $this->assertDatabaseHas('academic_departments', ['faculty_id' => $program->faculty_id, 'code' => 'SCI']);
        $this->post('/dashboard/admin/academic-structure/references/department', $payload)->assertSessionHasErrors('code');
        $this->actingAs($admin)->get('/dashboard/admin/academic-structure?program='.$program->id)->assertOk()->assertInertia(fn (Assert $page) => $page->component('dashboard/academicStructure/Index')->where('selectedProgram.id', $program->id)->where('unmapped.total', 1));
        $this->assertNull($entry->fresh()->curriculum_version_id);
    }

    public function test_establishment_saves_identity_and_contact_information_together(): void
    {
        [$admin] = $this->context();
        $university = University::where('context_key', 'current')->firstOrFail();
        $payload = [
            'code' => 'UNI', 'name' => 'Université révisée', 'revision' => $university->revision,
            'reason' => 'Mise à jour des coordonnées.', 'is_active' => true,
            'address' => '12 avenue du Campus', 'contact_email' => 'contact@example.test', 'contact_phone' => '+243 900 000 000',
        ];
        $url = '/dashboard/admin/academic-structure/references/university/'.$university->id;
        $this->actingAs($admin)->post($url, $payload)->assertSessionHasNoErrors();
        $university->refresh();
        $this->assertSame('Université révisée', $university->name);
        $this->assertSame('12 avenue du Campus', $university->site->address);

        $this->post($url, array_replace($payload, [
            'revision' => $university->revision, 'site_id' => $university->site_id, 'contact_email' => 'info@example.test',
        ]))->assertSessionHasNoErrors();
        $this->assertSame('info@example.test', $university->site()->firstOrFail()->contact_email);
        $this->assertDatabaseCount('sites', 1);
    }

    public function test_reference_edits_reject_stale_revision_and_duplicate_code(): void
    {
        [$admin,,,$program] = $this->context();
        $cycle = $program->cycle;
        $payload = $cycle->only(['code', 'name', 'normal_duration', 'progression_mode', 'weighting_mode', 'periods', 'is_active']) + ['revision' => 0, 'reason' => 'Édition concurrente périmée.'];
        $this->actingAs($admin)->post('/dashboard/admin/academic-structure/references/cycle/'.$cycle->id, $payload)->assertSessionHasErrors('revision');
        $this->post('/dashboard/admin/academic-structure/references/cycle', $payload)->assertSessionHasErrors('code');
        $this->assertSame(1, AcademicCycle::count());
    }

    public function test_draft_validation_publication_and_snapshots_preserve_student_course(): void
    {
        $context = $this->context();
        [$admin,$student,$entry,,$course] = $context;
        $version = $this->published($context);
        app(CurriculumService::class)->bind($version->id, $entry->id, $admin, 'Rattachement explicite du dossier.');
        $course->forceFill(['title' => 'Nouveau titre', 'credits' => 9, 'cmi_hours' => 90])->save();
        $added = (new Courses)->forceFill(['level_id' => $entry->level_id, 'code' => 'NEW', 'title' => 'Nouveau cours', 'credits' => 2]);
        $added->save();
        $this->actingAs($student)->get('/dashboard/student/courses')->assertOk()->assertInertia(fn (Assert $page) => $page->has('courses', 1)->where('courses.0.title', 'Titre initial')->where('courses.0.credits', 3)->where('curriculum.id', $version->id));
        $this->get('/dashboard/student/courses/'.$course->id)->assertOk()->assertInertia(fn (Assert $page) => $page->where('course.title', 'Titre initial')->where('course.cmi_hours', 20));
        $this->assertDatabaseCount('academic_enrollments', 1);
        $this->assertSame($entry->application_id, $entry->fresh()->application_id);
    }

    public function test_published_content_cannot_be_modified_reopened_or_deleted(): void
    {
        $context = $this->context();
        $v = $this->published($context);
        $service = app(CurriculumService::class);
        $this->refused(fn () => $service->saveDraft($v->id, ['revision' => $v->revision, 'reason' => 'Tentative de modification.', 'units' => $this->content($context, 4)], $context[0]), 'version');
        $this->refused(fn () => $service->transition($v->id, 'reopen', $v->revision, 'Tentative de réouverture.', $context[0]), 'version');
        $this->refused(fn () => $v->units()->firstOrFail()->update(['name' => 'Mutation']), 'units');
        $this->refused(fn () => $v->load('units.items')->units->first()->items->first()->update(['credits' => 99]), 'items');
        $this->refused(fn () => $v->delete(), 'version');
    }

    public function test_replacement_requires_confirmation_and_never_rebinds_existing_student(): void
    {
        $context = $this->context();
        [$admin,,$entry] = $context;
        $service = app(CurriculumService::class);
        $old = $this->published($context);
        $service->bind($old->id, $entry->id, $admin, 'Rattachement initial approuvé.');
        $new = $this->draft($context, 'V2', ['academic_year_id' => $entry->academic_year_id, 'clone_id' => $old->id]);
        $new = $service->saveDraft($new->id, ['revision' => 0, 'reason' => 'Nouveaux crédits approuvés.', 'units' => $this->content($context, 4)], $admin);
        $this->assertCount(1, $service->compare($old->id, $new->id));
        $this->approveLevel($new, $context);
        $new = $service->transition($new->id, 'validate', $new->revision, 'Contrôle de la nouvelle maquette.', $admin);
        $this->refused(fn () => $service->transition($new->id, 'publish', $new->revision, 'Publication sans remplacement.', $admin), 'replace_id');
        $new = $service->transition($new->id, 'publish', $new->revision, 'Remplacement officiel approuvé.', $admin, $old->id);
        $this->assertSame('replaced', $old->fresh()->status);
        $this->assertSame($old->id, $entry->fresh()->curriculum_version_id);
        $this->refused(fn () => $service->bind($new->id, $entry->id, $admin, 'Tentative de réaffectation.'), 'enrollment');
        $service->transition($old->id, 'archive', $old->fresh()->revision, 'Archivage avec conservation.', $admin);
        $this->assertSame($old->id, $entry->fresh()->curriculum_version_id);
    }

    public function test_cohort_scope_and_wrong_year_assignment_are_controlled(): void
    {
        $context = $this->context();
        [$admin,,$entry,$program] = $context;
        $cohort = app(StructureService::class)->save('cohort', ['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'code' => 'ENTRY', 'name' => 'Cohorte de test', 'is_active' => true, 'revision' => 0, 'reason' => 'Création de la cohorte.'], $admin);
        $otherYear = AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'draft']);
        $other = $this->published($context, 'OTHER', ['academic_year_id' => $otherYear->id]);
        $this->refused(fn () => app(CurriculumService::class)->bind($other->id, $entry->id, $admin, 'Tentative sur une autre année.'), 'academic_year_id');
        $v = $this->published($context, 'COHORT', ['admission_cohort_id' => $cohort->id]);
        app(CurriculumService::class)->bind($v->id, $entry->id, $admin, 'Cohorte déterminée explicitement.');
        $this->assertSame($cohort->id, $entry->fresh()->admission_cohort_id);
        $this->refused(fn () => app(CurriculumService::class)->draft(['academic_program_id' => $program->id, 'code' => 'INVALID', 'name' => 'Invalid', 'academic_year_id' => $otherYear->id, 'admission_cohort_id' => $cohort->id, 'reason' => 'Portée contradictoire.'], $admin), 'applicability');
        $this->assertSame('published', $other->fresh()->status);
    }

    public function test_credit_validation_and_lost_updates_do_not_destroy_the_draft(): void
    {
        $context = $this->context();
        $service = app(CurriculumService::class);
        $v = $this->draft($context);
        $units = $this->content($context);
        $units[0]['expected_credits'] = 5;
        $v = $service->saveDraft($v->id, ['revision' => 0, 'reason' => 'Préparation avec crédits à contrôler.', 'units' => $units], $context[0]);
        $this->refused(fn () => $service->transition($v->id, 'validate', $v->revision, 'Contrôle avant publication.', $context[0]), 'credits');
        $this->refused(fn () => $service->saveDraft($v->id, ['revision' => 0, 'reason' => 'Édition concurrente périmée.', 'units' => $this->content($context)], $context[0]), 'revision');
        $this->assertSame(1, $v->units()->count());
        $this->assertSame('draft', $v->fresh()->status);
    }

    public function test_student_professor_and_admin_without_permission_cannot_mutate_structure(): void
    {
        $context = $this->context();
        [, $student,,$program] = $context;
        $url = '/dashboard/admin/academic-structure';
        $this->actingAs($student)->get($url)->assertForbidden();
        $this->post($url.'/versions', ['academic_program_id' => $program->id])->assertForbidden();
        $professor = User::factory()->create();
        $professor->assignRole(Role::findOrCreate('professor', 'web'));
        $this->actingAs($professor)->post($url.'/references/cycle', [])->assertForbidden();
        $admin = User::factory()->create();
        $role = Role::findOrCreate('admin', 'web');
        $role->syncPermissions([]);
        $admin->assignRole($role);
        $this->actingAs($admin)->get($url)->assertForbidden();
    }

    public function test_foreign_institution_ids_are_not_exposed_or_accepted(): void
    {
        $context = $this->context();
        [$admin] = $context;
        $foreign = University::create(['code' => 'OTHER', 'name' => 'Autre institution', 'is_active' => true]);
        $cycle = AcademicCycle::create(['university_id' => $foreign->id, 'code' => 'OTHER', 'name' => 'Autre cycle', 'normal_duration' => 2, 'progression_mode' => 'annual', 'weighting_mode' => 'credits', 'periods' => [['code' => 'A', 'name' => 'Année']]]);
        $this->actingAs($admin)->post('/dashboard/admin/academic-structure/references/cycle/'.$cycle->id, ['code' => 'EDIT', 'name' => 'Mutation', 'normal_duration' => 2, 'progression_mode' => 'annual', 'weighting_mode' => 'credits', 'periods' => [['code' => 'A', 'name' => 'Année']], 'is_active' => true, 'revision' => 0, 'reason' => 'Tentative hors périmètre.'])->assertNotFound();
        $this->assertSame('OTHER', $cycle->fresh()->code);
    }

    public function test_new_year_does_not_change_curriculum_or_financial_references(): void
    {
        $context = $this->context();
        [$admin,,$entry,$program,$course] = $context;
        $v = $this->published($context);
        app(CurriculumService::class)->bind($v->id, $entry->id, $admin, 'Rattachement initial du cursus.');
        $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Historique', 'installment' => 1, 'amount_cents' => 10000]);
        $entry->update(['enrollment_status' => 'completed']);
        $before = $entry->fresh()->getAttributes();
        $year = AcademicYear::create(['title' => '2028-2029', 'start_date' => '2028-10-01', 'end_date' => '2029-09-30', 'status' => 'draft']);
        $secondLevel = \App\Models\Level::create(['faculty_id' => $program->faculty_id, 'code' => 'T2', 'title' => 'Deuxième niveau']);
        $program->levels()->attach($secondLevel->id, ['position' => 2]);
        $promotion = \App\Models\AcademicStructure\AcademicPromotion::create([
            'academic_program_id' => $program->id, 'academic_year_id' => $year->id, 'level_id' => $secondLevel->id,
            'code' => 'MANUEL-T2', 'name' => 'Promotion préparée manuellement',
        ]);
        app(CloseAcademicYear::class)->execute($entry->academic_year_id, $admin->id, 'Clôture administrative vérifiée.');
        $previous = $entry->academicYear->fresh()->getAttributes();
        app(OpenAcademicYear::class)->execute($year->id);
        app(OpenAcademicYear::class)->execute($year->id);

        $newDraft = $program->versions()->where('academic_year_id', $year->id)->sole();
        $this->assertSame('draft', $newDraft->status);
        $this->assertDatabaseHas('curriculum_items', ['curriculum_version_id' => $newDraft->id, 'source_course_id' => $course->id]);
        $this->assertDatabaseHas('academic_promotions', [
            'academic_program_id' => $program->id, 'academic_year_id' => $year->id, 'level_id' => $entry->level_id,
        ]);
        $this->assertDatabaseCount('academic_promotions', 2);
        $this->assertSame('Promotion préparée manuellement', $promotion->fresh()->name);
        $this->assertDatabaseMissing('admission_cohorts', ['academic_year_id' => $year->id]);
        $this->assertSame('open', $year->fresh()->status);
        $this->assertSame($previous, $entry->academicYear->fresh()->getAttributes());
        $this->assertSame($before, $entry->fresh()->getAttributes());
        $this->assertDatabaseHas('student_obligations', ['academic_enrollment_id' => $entry->id, 'amount_cents' => 10000]);
    }

    public function test_program_selection_is_explicit_when_several_programs_share_a_level(): void
    {
        [$admin,$student,$entry,$program] = $this->context();
        $second = app(StructureService::class)->save('program', ['faculty_id' => $program->faculty_id, 'academic_cycle_id' => $program->academic_cycle_id, 'code' => 'SECOND', 'name' => 'Second programme', 'is_active' => true, 'revision' => 0, 'level_ids' => [$entry->level_id], 'reason' => 'Création du second parcours.'], $admin);
        $snapshot = ['faculty_id' => $program->faculty_id, 'level_id' => $entry->level_id, 'year_id' => $entry->academic_year_id, 'name' => 'Étudiant', 'email' => $student->email, 'program' => 'Études', 'isConfirmed' => true];
        $entry->application->update(['form_snapshot' => $snapshot]);
        try {
            app(EnrollmentValidator::class)->canSubmit($entry->application->fresh());
            $this->fail('Ambiguous program should be refused');
        } catch (InvalidEnrollmentStateException $exception) {
            $this->assertStringContainsString('explicitement', $exception->getMessage());
        }
        $entry->application->update(['form_snapshot' => $snapshot + ['academic_program_id' => $program->id]]);
        app(EnrollmentValidator::class)->canSubmit($entry->application->fresh());
        $this->actingAs($student)->get('/dashboard/enrollments/create')->assertOk()->assertInertia(fn (Assert $page) => $page->has('levelsByFaculty.'.$program->faculty_id.'.0.programs', 2));
        $program->update(['is_active' => false]);
        $second->update(['is_active' => false]);
        $this->get('/dashboard/enrollments/create')->assertOk()->assertInertia(fn (Assert $page) => $page->where('levelsByFaculty', []));
        try {
            app(EnrollmentValidator::class)->canSubmit($entry->application->fresh());
            $this->fail('Closed program should be refused');
        } catch (InvalidEnrollmentStateException $exception) {
            $this->assertStringContainsString('pas ouvert', $exception->getMessage());
        }
    }

    public function test_new_admission_resolves_only_an_unambiguous_annual_program(): void
    {
        $context = $this->context();
        [$admin,,$oldEntry,$program] = $context;
        $version = $this->published($context);
        $this->assertNull($oldEntry->fresh()->curriculum_version_id);
        $activate = function (array $snapshot = []) use ($admin, $oldEntry) {
            $user = User::factory()->create();
            $application = Enrollment::create(['student_id' => $user->id, 'level_id' => $oldEntry->level_id, 'academic_year_id' => $oldEntry->academic_year_id, 'status' => 'validated', 'form_snapshot' => $snapshot]);

            return app(StudentAdmissionService::class)->activate($application, $admin->id, false);
        };
        $resolved = $activate();
        $this->assertSame($version->id, $resolved->curriculum_version_id);
        $second = app(StructureService::class)->save('program', ['faculty_id' => $program->faculty_id, 'academic_cycle_id' => $program->academic_cycle_id, 'code' => 'P2', 'name' => 'Autre programme', 'is_active' => true, 'revision' => 0, 'level_ids' => [$oldEntry->level_id], 'reason' => 'Création du second programme.'], $admin);
        $otherContext = $context;
        $otherContext[3] = $second;
        $otherVersion = $this->published($otherContext, 'V2');
        $ambiguous = $activate();
        $this->assertNull($ambiguous->curriculum_version_id);
        $chosen = $activate(['academic_program_id' => $second->id]);
        $this->assertSame($otherVersion->id, $chosen->curriculum_version_id);
        $this->assertNull($oldEntry->fresh()->curriculum_version_id);
        $this->assertSame($version->id, $resolved->fresh()->curriculum_version_id);

        $archivedDuringSelection = false;
        DB::listen(function (QueryExecuted $query) use ($admin, $otherVersion, &$archivedDuringSelection) {
            if ($archivedDuringSelection || ! str_starts_with($query->sql, 'select * from "curriculum_versions" where "status" =')) {
                return;
            }
            $archivedDuringSelection = true;
            app(CurriculumService::class)->transition($otherVersion->id, 'archive', $otherVersion->revision, 'Archivage pendant la résolution annuelle.', $admin);
        });
        $afterArchive = $activate(['academic_program_id' => $second->id]);
        $this->assertTrue($archivedDuringSelection);
        $this->assertNull($afterArchive->curriculum_version_id);
        $this->assertSame($otherVersion->id, $chosen->fresh()->curriculum_version_id);
    }

    public function test_promotion_group_association_is_contextual_and_preserves_teaching_records(): void
    {
        $context = $this->context();
        [$admin,,$entry,$program,$course] = $context;
        $service = app(StructureService::class);
        $promotion = $service->save('promotion', ['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'level_id' => $entry->level_id, 'code' => 'ANNUAL', 'name' => 'Promotion de test', 'is_active' => true, 'revision' => 0, 'reason' => 'Promotion annuelle approuvée.'], $admin);
        $intake = Intake::create(['name' => 'Groupe de test']);
        $group = Classes::create(['faculty_id' => $program->faculty_id, 'level_id' => $entry->level_id, 'intake_id' => $intake->id, 'status' => 'OPEN']);
        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id, 'class_id' => $group->id, 'is_published' => true]);
        $before = $offering->fresh()->getAttributes();
        $service->save('group-promotion', ['academic_promotion_id' => $promotion->id, 'revision' => 0, 'reason' => 'Rattachement explicite du groupe.'], $admin, $group->id);
        $this->assertSame($promotion->id, $group->fresh()->academic_promotion_id);
        $this->assertSame($before, $offering->fresh()->getAttributes());
        $year = AcademicYear::create(['title' => '2029-2030', 'start_date' => '2029-10-01', 'end_date' => '2030-09-30', 'status' => 'draft']);
        $other = $service->save('promotion', ['academic_program_id' => $program->id, 'academic_year_id' => $year->id, 'level_id' => $entry->level_id, 'code' => 'OTHER', 'name' => 'Autre promotion', 'is_active' => true, 'revision' => 0, 'reason' => 'Autre promotion annuelle.'], $admin);
        $this->refused(fn () => $service->save('group-promotion', ['academic_promotion_id' => $other->id, 'revision' => 0, 'reason' => 'Tentative de changement historique.'], $admin, $group->id), 'group');
    }

    public function test_resources_timetable_and_payment_references_survive_curriculum_changes(): void
    {
        Storage::fake('local');
        $context = $this->context();
        [$admin,$student,$entry,,$course] = $context;
        $offering = AcademicOffering::create(['course_id' => $course->id, 'level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id, 'is_published' => true]);
        $starts = CarbonImmutable::now('Africa/Kinshasa')->startOfDay()->setTime(9, 0)->utc();
        $session = AcademicSession::create(['academic_offering_id' => $offering->id, 'starts_at' => $starts, 'ends_at' => $starts->addHour(), 'room' => 'Salle historique', 'is_published' => true]);
        Storage::disk('local')->put('academic-resources/historical.pdf', '%PDF-1.4 historical');
        $resource = AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'material', 'title' => 'Support historique', 'path' => 'academic-resources/historical.pdf', 'filename' => 'historical.pdf', 'is_published' => true]);
        AccessRule::create(['feature' => 'materials_download', 'mode' => 'open', 'is_active' => true]);
        $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Historique', 'installment' => 1, 'amount_cents' => 5000]);
        $beforeSession = $session->fresh()->getAttributes();
        $version = $this->published($context);
        app(CurriculumService::class)->bind($version->id, $entry->id, $admin, 'Rattachement de référence.');
        $course->forceFill(['title' => 'Catalogue révisé', 'credits' => 7])->save();
        $this->actingAs($student)->get('/dashboard/student/resources/'.$resource->id.'/download')->assertOk();
        $this->get('/dashboard/student/courses/'.$course->id.'/sessions')->assertOk()->assertInertia(fn (Assert $page) => $page->has('sessions', 1)->where('course.title', 'Titre initial')->where('course.credits', 3));
        $this->assertSame($beforeSession, $session->fresh()->getAttributes());
        $this->assertDatabaseHas('academic_resources', ['id' => $resource->id, 'academic_offering_id' => $offering->id, 'path' => 'academic-resources/historical.pdf']);
        $this->assertDatabaseHas('student_obligations', ['academic_enrollment_id' => $entry->id, 'amount_cents' => 5000]);
    }
}
