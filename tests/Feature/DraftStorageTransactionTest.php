<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\User;
use App\Modules\Enrollment\Application\DTOs\SaveProgressDTO;
use App\Modules\Enrollment\Application\UseCases\SaveProgressUseCase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DraftStorageTransactionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh', ['--force' => true]);
        RefreshDatabaseState::$migrated = false;
    }

    private function save(User $user, string $contents, ?string $uuid = null): Enrollment
    {
        $faculty = Faculty::firstOrCreate(['code' => 'TEST'], ['name' => 'Test']);
        $level = Level::firstOrCreate(['faculty_id' => $faculty->id, 'code' => 'T1'], ['title' => 'Test']);
        $year = AcademicYear::firstOrCreate(['title' => '2026-2027'], ['start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $path = 'enrollments/tmp/'.$user->id.'/'.hash('sha256', $contents).'/document.pdf';
        Storage::disk('temp')->put($path, $contents);

        return app(SaveProgressUseCase::class)->execute(SaveProgressDTO::fromRequest([
            'uuid' => $uuid, 'last_step' => 1,
            'form_snapshot' => ['level_id' => $level->id, 'year_id' => $year->id, 'documents' => ['diploma' => ['temp' => ['path' => $path], 'filename' => 'document.pdf', 'mime' => 'application/pdf']]],
        ], $user->id));
    }

    public function test_replacement_deletes_previous_file_only_after_successful_commit(): void
    {
        Storage::fake('temp');
        Storage::fake('local');
        $user = User::factory()->create();
        $entry = $this->save($user, 'original');
        $old = EnrollmentDocument::firstOrFail()->path;
        $this->save($user, 'replacement', $entry->uuid);
        Storage::disk('local')->assertMissing($old);
        Storage::disk('local')->assertExists(EnrollmentDocument::firstOrFail()->path);
        $this->assertSame([], Storage::disk('temp')->allFiles());
    }

    public function test_database_failure_preserves_original_and_removes_uncommitted_copy(): void
    {
        Storage::fake('temp');
        Storage::fake('local');
        $user = User::factory()->create();
        $entry = $this->save($user, 'original');
        $old = EnrollmentDocument::firstOrFail()->path;
        $snapshot = $entry->fresh()->form_snapshot;
        Event::listen('eloquent.saving: '.EnrollmentDocument::class, function () {
            throw new \RuntimeException('Injected persistence failure');
        });
        try {
            $this->save($user, 'replacement', $entry->uuid);
            $this->fail('Expected persistence failure');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Injected persistence failure', $exception->getMessage());
        }
        $this->assertSame($snapshot, $entry->fresh()->form_snapshot);
        $this->assertSame($old, EnrollmentDocument::firstOrFail()->path);
        $this->assertSame([$old], Storage::disk('local')->allFiles());
        $this->assertCount(1, Storage::disk('temp')->allFiles());
    }
}
