<?php

namespace Tests\Integration;

use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Student\AcademicAudit;
use App\Models\Student\StudentPayment;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Modules\AcademicStructure\Application\Services\StructureService;
use App\Modules\Student\Application\Services\StudentFinanceService;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Spatie\Permission\Models\Role;
use Symfony\Component\Process\Process;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class PostgresConcurrencyTest extends TestCase
{
    use CreatesStudentContext;

    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql' || config('database.connections.pgsql.database') !== 'umk_test') {
            throw new \RuntimeException('Use the disposable PostgreSQL database umk_test only.');
        }
        $this->artisan('migrate:fresh', ['--force' => true]);
        RefreshDatabaseState::$migrated = false;
    }

    private function race(string $mode, int $first, int $second, ?int $alternateFirst = null): array
    {
        $gate = sys_get_temp_dir().'/umk-race-'.bin2hex(random_bytes(8));
        mkdir($gate, 0700);
        $processes = [];
        try {
            for ($i = 0; $i < 2; $i++) {
                $process = new Process([PHP_BINARY, base_path('tests/Support/concurrency-worker.php'), $mode, (string) ($i === 1 && $alternateFirst !== null ? $alternateFirst : $first), (string) $second, $gate], base_path(), ['APP_ENV' => 'testing', 'CACHE_STORE' => 'array']);
                $process->setTimeout(20)->start();
                $processes[] = $process;
            }
            $deadline = microtime(true) + 10;
            while (count(glob($gate.'/ready-*')) < 2 && microtime(true) < $deadline) {
                usleep(10000);
            }
            $this->assertCount(2, glob($gate.'/ready-*'), 'Both database connections must reach the barrier.');
            touch($gate.'/go');
            $results = [];
            foreach ($processes as $process) {
                $process->wait();
                $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
                $results[] = json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR);
            }

            return $results;
        } finally {
            foreach ($processes as $process) {
                if ($process->isRunning()) {
                    $process->stop();
                }
            }
            foreach (glob($gate.'/*') as $file) {
                unlink($file);
            }
            rmdir($gate);
        }
    }

    public function test_two_connections_allocate_distinct_matricules(): void
    {
        $faculty = Faculty::create(['name' => 'Test', 'code' => 'TEST']);
        $level = Level::create(['faculty_id' => $faculty->id, 'code' => 'T1', 'title' => 'Test']);
        $year = AcademicYear::create(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $results = $this->race('matricule', $level->id, $year->id);
        sort($results);
        $this->assertSame(['TEST0001', 'TEST0002'], $results);
        $this->assertDatabaseHas('faculty_matricule_sequences', ['faculty_code' => 'TEST', 'last_number' => 2]);
    }

    public function test_two_confirmations_have_one_financial_effect_and_one_audit_event(): void
    {
        $user = $this->studentContext();
        $user->assignRole(Role::findOrCreate('admin', 'web'));
        $entry = $user->studentProfile->enrollments()->firstOrFail();
        $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Test', 'installment' => 1, 'amount_cents' => 10000]);
        $payment = app(StudentFinanceService::class)->record($entry, $user, ['amount' => '100', 'method' => 'bank_transfer', 'reference' => 'RACE-1']);
        $this->assertSame(['confirmed', 'confirmed'], $this->race('payment', $payment->id, $user->id));
        $this->assertSame(1, StudentPayment::count());
        $this->assertSame(1, AcademicAudit::where('action', 'payment_confirmed')->where('entity_id', $payment->id)->count());
        $this->assertSame(10000, app(StudentFinanceService::class)->balance($entry)['paid_cents']);
    }

    public function test_concurrent_admission_submissions_and_conflicting_decisions_have_one_effect(): void
    {
        $faculty = Faculty::create(['name' => 'Test', 'code' => 'TEST']);
        $level = Level::create(['faculty_id' => $faculty->id, 'code' => 'T1', 'title' => 'Test']);
        $year = AcademicYear::create(['title' => 'Année de test', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $candidate = User::factory()->create();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $entry = Enrollment::create(['student_id' => $candidate->id, 'level_id' => $level->id, 'academic_year_id' => $year->id, 'status' => 'draft',
            'form_snapshot' => ['faculty_id' => $faculty->id, 'level_id' => $level->id, 'year_id' => $year->id, 'name' => 'Test', 'email' => $candidate->email, 'program' => 'Test', 'isConfirmed' => true]]);
        $this->assertSame(['TEST0001', 'TEST0001'], $this->race('admission-submit', $entry->id, $candidate->id));
        $this->assertSame(1, $entry->events()->where('event', 'submitted')->count());
        $results = $this->race('admission-decision', $entry->id, $admin->id, -$entry->id);
        $this->assertContains('refused', $results);
        $final = $entry->fresh()->status->value;
        $this->assertContains($final, ['validated', 'rejected']);
        $this->assertContains($final, $results);
        $this->assertSame(1, $entry->events()->whereIn('event', ['validated', 'rejected'])->count());
        $this->assertSame($final === 'validated' ? 1 : 0, $entry->academicEnrollment()->count());
        $this->assertSame('TEST0001', $entry->fresh()->matricule);
    }

    private function curriculumContext(): array
    {
        $user = $this->studentContext();
        $user->assignRole(Role::findOrCreate('admin', 'web'));
        $entry = $user->studentProfile->enrollments()->firstOrFail();
        $structure = app(StructureService::class);
        $base = ['revision' => 0, 'is_active' => true, 'reason' => 'Concurrency fixture setup'];
        $uni = $structure->save('university', $base + ['code' => 'UNI', 'name' => 'Test institution'], $user);
        $entry->level->faculty->forceFill(['university_id' => $uni->id])->save();
        $cycle = $structure->save('cycle', $base + ['code' => 'C', 'name' => 'Test cycle', 'normal_duration' => 1, 'progression_mode' => 'annual', 'weighting_mode' => 'credits', 'periods' => [['code' => 'A', 'name' => 'Annual']]], $user);
        $program = $structure->save('program', $base + ['code' => 'P', 'name' => 'Test program', 'faculty_id' => $entry->level->faculty_id, 'academic_cycle_id' => $cycle->id, 'level_ids' => [$entry->level_id]], $user);
        $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'title' => 'Test course', 'credits' => 3]);
        $course->save();

        return [$user, $entry, $program, $course];
    }

    private function curriculum(array $context, string $code, ?int $cohort = null): CurriculumVersion
    {
        [$user, $entry, $program, $course] = $context;
        $service = app(CurriculumService::class);
        $version = $service->draft(['academic_program_id' => $program->id, 'code' => $code, 'name' => 'Test version', 'reason' => 'Concurrency draft fixture'] + ($cohort ? ['admission_cohort_id' => $cohort] : ['academic_year_id' => $entry->academic_year_id]), $user);

        $version = $service->saveDraft($version->id, ['revision' => 0, 'reason' => 'Concurrency content fixture', 'units' => [['level_id' => $entry->level_id, 'period_code' => 'A', 'code' => 'UE', 'name' => 'Unit', 'items' => [['source_course_id' => $course->id, 'credits' => 3]]]]], $user);
        $level = collect($service->levelWorkspace($version, $program))->firstWhere('id', $entry->level_id);

        return $service->approveLevel($version->id, $entry->level_id, $version->revision, $level['signature'], $user);
    }

    public function test_two_publications_cannot_create_competing_active_versions(): void
    {
        $context = $this->curriculumContext();
        $service = app(CurriculumService::class);
        $a = $this->curriculum($context, 'V1');
        $b = $this->curriculum($context, 'V2');
        $a = $service->transition($a->id, 'validate', $a->revision, 'Validate publication fixture', $context[0]);
        $b = $service->transition($b->id, 'validate', $b->revision, 'Validate publication fixture', $context[0]);
        $results = $this->race('curriculum-publish', $a->id, $a->revision, $b->id);
        sort($results);
        $this->assertSame(['published', 'refused'], $results);
        $this->assertSame(1, CurriculumVersion::where('status', 'published')->count());
        $this->assertSame(1, AcademicAudit::where('action', 'curriculum_publish')->count());
    }

    public function test_two_draft_editors_cannot_silently_overwrite_each_other(): void
    {
        $context = $this->curriculumContext();
        $version = $this->curriculum($context, 'DRAFT');
        $results = $this->race('curriculum-edit', $version->id, $version->revision);
        sort($results);
        $this->assertSame(['refused', 'updated'], $results);
        $this->assertSame(2, $version->fresh()->revision);
        $this->assertSame(1, AcademicAudit::where('action', 'curriculum_draft_updated')->where('reason', 'Concurrent draft edit')->count());
    }

    public function test_two_creators_cannot_allocate_the_same_institutional_code(): void
    {
        $context = $this->curriculumContext();
        $results = $this->race('cycle-code', $context[2]->id, $context[0]->id);
        sort($results);
        $this->assertSame(['created', 'refused'], $results);
        $this->assertSame(1, AcademicCycle::where('code', 'RACE')->count());
    }

    public function test_competing_assignments_keep_exactly_one_curriculum_for_an_enrollment(): void
    {
        $context = $this->curriculumContext();
        [$actor,$entry,$program] = $context;
        $service = app(CurriculumService::class);
        $cohort = app(StructureService::class)->save('cohort', ['academic_program_id' => $program->id, 'academic_year_id' => $entry->academic_year_id, 'code' => 'COHORT', 'name' => 'Test cohort', 'revision' => 0, 'is_active' => true, 'reason' => 'Concurrency cohort fixture'], $actor);
        $versions = [$this->curriculum($context, 'YEAR'), $this->curriculum($context, 'COHORT', $cohort->id)];
        foreach ($versions as $index => $version) {
            $version = $service->transition($version->id, 'validate', $version->revision, 'Validate binding fixture', $actor);
            $versions[$index] = $service->transition($version->id, 'publish', $version->revision, 'Publish binding fixture', $actor);
        }
        $results = $this->race('curriculum-bind', $versions[0]->id, $entry->id, $versions[1]->id);
        sort($results);
        $this->assertSame(['bound', 'refused'], $results);
        $this->assertContains($entry->fresh()->curriculum_version_id, [$versions[0]->id, $versions[1]->id]);
        $this->assertSame(1, AcademicAudit::where('action', 'curriculum_bound')->count());
    }
}
