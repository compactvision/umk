<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Identity\Domain\Exceptions\TooManyLoginAttemptsException;
use App\Modules\Identity\Infrastructure\Security\CacheLoginRateLimiter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhaseOneSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_site_writes_require_an_administrator(): void
    {
        $this->postJson('/api/site', ['siteName' => 'Unauthorized'])->assertUnauthorized();
        $this->putJson('/api/site', ['siteName' => 'Unauthorized'])->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/site', ['siteName' => 'Unauthorized'])->assertForbidden();
        $this->putJson('/api/site', ['siteName' => 'Unauthorized'])->assertForbidden();
        $this->assertDatabaseCount('sites', 0);
    }

    public function test_login_errors_do_not_disclose_account_existence(): void
    {
        $user = User::factory()->create();
        $known = $this->from('/login')->post('/login', ['email' => $user->email, 'password' => 'wrong']);
        $message = session('errors')->first('email');
        $unknown = $this->from('/login')->post('/login', ['email' => 'absent@example.test', 'password' => 'wrong']);
        $known->assertRedirect('/login');
        $unknown->assertRedirect('/login');
        $this->assertSame($message, session('errors')->first('email'));
        $this->assertGuest();
    }

    public function test_logout_invalidates_session_data_and_rotates_csrf_token(): void
    {
        $this->actingAs(User::factory()->create())->withSession(['private_marker' => 'old', '_token' => 'old-token'])
            ->post('/logout')->assertRedirect('/login')->assertSessionMissing('private_marker');
        $this->assertNotSame('old-token', session()->token());
        $this->assertGuest();
    }

    public function test_login_lock_survives_a_minute_and_normalizes_email(): void
    {
        $limiter = app(CacheLoginRateLimiter::class);
        for ($i = 0; $i < 5; $i++) {
            $limiter->hit('USER@example.test');
        }
        $this->travel(2)->minutes();
        $this->expectException(TooManyLoginAttemptsException::class);
        $limiter->ensureIsNotLimited('user@example.test');
    }

    public function test_temporary_documents_cannot_be_claimed_by_another_user(): void
    {
        Storage::fake('temp');
        Storage::fake('local');
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $upload = $this->actingAs($owner)->postJson('/dashboard/enrollments/documents/upload', [
            'key' => 'diploma', 'file' => UploadedFile::fake()->image('diploma.png'),
        ])->assertOk()->json('temp');
        $this->actingAs($other)->postJson('/dashboard/enrollments/save-progress', [
            'last_step' => 1, 'form_snapshot' => ['documents' => ['diploma' => [
                'temp' => $upload, 'filename' => 'diploma.png', 'mime' => 'image/png',
            ]]],
        ])->assertUnprocessable()->assertJsonValidationErrors('documents');
        Storage::disk('temp')->assertExists($upload['path']);
        $this->assertDatabaseCount('enrollments', 0);
        $this->assertDatabaseCount('enrollment_documents', 0);
    }

    public function test_invalid_upload_and_failed_storage_are_reported(): void
    {
        Storage::fake('temp');
        $this->actingAs(User::factory()->create())
            ->postJson('/dashboard/enrollments/documents/upload', ['key' => 'diploma', 'file' => UploadedFile::fake()->create('bad.html', 1, 'text/html')])
            ->assertUnprocessable()->assertJsonValidationErrors('file');
        Storage::shouldReceive('disk')->with('temp')->once()->andReturnSelf();
        Storage::shouldReceive('put')->once()->andReturn(false);
        $this->postJson('/dashboard/enrollments/documents/upload', ['key' => 'diploma', 'file' => UploadedFile::fake()->image('ok.png')])->assertStatus(503);
    }

    public function test_http_preflight_reports_failures_without_printing_response_content(): void
    {
        Http::fake(['*' => Http::sequence()->push('private diagnostic', 503)->push('healthy', 200)]);
        $this->artisan('app:preflight', ['--http' => true])->expectsOutput('Le contrôle HTTP /up a échoué.')->doesntExpectOutput('private diagnostic')->assertFailed();
        $this->artisan('app:preflight', ['--http' => true])->assertSuccessful();
    }
}
