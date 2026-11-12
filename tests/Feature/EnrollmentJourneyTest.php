<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EnrollmentJourneyTest extends TestCase
{
    use RefreshDatabase;

    private function student(string $email = 'student@example.test'): User
    {
        $user = new User;
        $user->forceFill(['first_name' => 'Test', 'last_name' => 'Étudiant', 'email' => $email, 'password' => 'test-password', 'email_verified_at' => now()])->save();

        return $user;
    }

    private function snapshot(): array
    {
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = DB::table('academic_years')->insertGetId(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);

        return ['faculty_id' => (string) $faculty, 'level_id' => (string) $level, 'year_id' => (string) $year, 'name' => 'Test Étudiant', 'email' => 'student@example.test', 'program' => 'Droit', 'documents' => []];
    }

    public function test_save_returns_the_uuid_and_updates_the_same_draft(): void
    {
        $student = $this->student();
        $snapshot = $this->snapshot();
        $snapshot['cardNumber'] = 'test-card-data';
        $snapshot['cvv'] = 'test-code';
        $response = $this->actingAs($student)->postJson('/dashboard/enrollments/save-progress', ['last_step' => 2, 'form_snapshot' => $snapshot])->assertOk()->assertJsonPath('ok', true);
        $uuid = $response->json('draft.uuid');
        $this->assertNotEmpty($uuid);
        $this->assertArrayNotHasKey('cardNumber', $response->json('draft.form_snapshot'));
        $this->assertArrayNotHasKey('cvv', $response->json('draft.form_snapshot'));
        $this->postJson('/dashboard/enrollments/save-progress', ['uuid' => $uuid, 'last_step' => 3, 'form_snapshot' => $snapshot])->assertOk()->assertJsonPath('draft.uuid', $uuid)->assertJsonPath('draft.last_step', 3);
        $this->assertDatabaseCount('enrollments', 1);
        $this->get('/dashboard/enrollments/'.$uuid.'/edit')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/enrollments/Enrollment')
            ->where('draft.uuid', $uuid)
            ->where('draft.last_step', 3)
            ->where('draft.form_snapshot.program', 'Droit')
        );

        $this->postJson('/dashboard/enrollments/save-progress', ['uuid' => $uuid, 'last_step' => 1, 'form_snapshot' => $snapshot])->assertOk()->assertJsonPath('draft.last_step', 1);
    }

    public function test_another_student_cannot_change_the_draft(): void
    {
        $owner = $this->student();
        $other = $this->student('other@example.test');
        $snapshot = $this->snapshot();
        $draft = Enrollment::create(['student_id' => $owner->id, 'level_id' => $snapshot['level_id'], 'academic_year_id' => $snapshot['year_id'], 'status' => 'draft']);
        $this->actingAs($other)->postJson('/dashboard/enrollments/save-progress', ['uuid' => $draft->uuid, 'last_step' => 2, 'form_snapshot' => $snapshot])->assertUnprocessable()->assertJsonValidationErrors('uuid');
        $this->assertNull($draft->fresh()->form_snapshot);
    }

    public function test_documents_survive_saving_and_can_be_replaced(): void
    {
        Storage::fake('temp');
        Storage::fake('local');
        $student = $this->student();
        $snapshot = $this->snapshot();
        Storage::disk('temp')->put("enrollments/tmp/{$student->id}/token/diploma.pdf", 'first document');
        $snapshot['documents']['diploma'] = ['temp' => ['token' => 'token', 'path' => "enrollments/tmp/{$student->id}/token/diploma.pdf"], 'filename' => 'diploma.pdf', 'mime' => 'application/pdf', 'size_bytes' => 14];
        $response = $this->actingAs($student)->postJson('/dashboard/enrollments/save-progress', ['last_step' => 4, 'form_snapshot' => $snapshot])->assertOk();
        $uuid = $response->json('draft.uuid');
        $document = EnrollmentDocument::firstOrFail();
        Storage::disk('local')->assertExists($document->path);
        $this->assertSame(hash('sha256', 'first document'), $document->sha256);
        $this->assertSame($document->uuid, $response->json('draft.form_snapshot.documents.diploma.uuid'));
        $oldPath = $document->path;
        Storage::disk('temp')->put("enrollments/tmp/{$student->id}/replacement/diploma.pdf", 'replacement');
        $snapshot['documents']['diploma']['temp'] = ['token' => 'replacement', 'path' => "enrollments/tmp/{$student->id}/replacement/diploma.pdf"];
        $this->postJson('/dashboard/enrollments/save-progress', ['uuid' => $uuid, 'last_step' => 4, 'form_snapshot' => $snapshot])->assertOk();
        $this->assertDatabaseCount('enrollment_documents', 1);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($document->fresh()->path);
        $this->assertSame(hash('sha256', 'replacement'), $document->fresh()->sha256);
        $replacementPath = $document->fresh()->path;
        $snapshot['documents'] = [];
        $this->postJson('/dashboard/enrollments/save-progress', ['uuid' => $uuid, 'last_step' => 3, 'form_snapshot' => $snapshot])->assertOk();
        $this->assertSame(0, EnrollmentDocument::count());
        Storage::disk('local')->assertMissing($replacementPath);

    }
}
