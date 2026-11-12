<?php

namespace Tests\Feature;

use App\Models\Courses;
use App\Models\Student\StudentPayment;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class AcademicStructureMigrationTest extends TestCase
{
    use CreatesStudentContext;

    public function test_additive_migration_preserves_existing_identifiers_finance_and_unresolved_history(): void
    {
        $database = DB::connection();
        $this->assertTrue(app()->environment('testing') && (
            ($database->getDriverName() === 'sqlite' && $database->getDatabaseName() === ':memory:')
            || ($database->getDriverName() === 'pgsql' && $database->getDatabaseName() === 'umk_test'
                && in_array($database->getConfig('host'), ['127.0.0.1', 'localhost'], true))
        ), 'This test requires a disposable test database.');
        $boundary = '2026_11_04_180000_add_versioned_academic_structure.php';
        $paths = collect(glob(database_path('migrations/*.php')))
            ->filter(fn ($file) => basename($file) < $boundary)->values()->all();
        // Build the historical schema in order. Later migrations may depend on it and refuse reversal.
        $this->artisan('migrate:fresh', ['--force' => true, '--path' => $paths, '--realpath' => true])->assertSuccessful();
        RefreshDatabaseState::$migrated = false;
        $migration = require database_path('migrations/'.$boundary);
        $user = $this->studentContext();
        $entry = $user->studentProfile->enrollments()->firstOrFail();
        $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'title' => 'Cours historique', 'code' => 'HIST', 'credits' => 3]);
        $course->save();
        $obligation = $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Frais historiques', 'installment' => 1, 'amount_cents' => 5000]);
        $payment = $entry->payments()->create(['uuid' => (string) Str::uuid(), 'kind' => 'tuition', 'amount_cents' => 1000, 'currency' => 'USD', 'status' => 'confirmed', 'method' => 'cash', 'reference' => 'HISTORICAL-REF', 'recorded_by' => $user->id, 'confirmed_by' => $user->id, 'confirmed_at' => now()]);
        $before = $entry->getAttributes();
        $migration->up();
        $this->assertSame($before, array_intersect_key($entry->fresh()->getAttributes(), $before));
        $this->assertNull($entry->fresh()->curriculum_version_id);
        $this->assertNull($entry->level->faculty->fresh()->university_id);
        $this->assertDatabaseHas('courses', ['id' => $course->id, 'credits' => 3]);
        $this->assertDatabaseHas('student_obligations', ['id' => $obligation->id, 'amount_cents' => 5000]);
        $this->assertDatabaseHas('student_payments', ['id' => $payment->id, 'reference' => 'HISTORICAL-REF', 'amount_cents' => 1000]);
        $this->assertSame(1, StudentPayment::count());
        $this->assertDatabaseCount('universities', 0);
    }
}
