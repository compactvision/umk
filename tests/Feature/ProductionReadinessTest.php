<?php

namespace Tests\Feature;

use App\Models\Student\AccessRule;
use App\Modules\Student\Application\Services\AcademicAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    public function test_batch_access_decisions_preserve_priority_and_read_current_policy_each_time(): void
    {
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->sole();
        $rules = ['feature' => 'documents_request', 'is_active' => true];
        AccessRule::create($rules + ['academic_year_id' => $entry->academic_year_id, 'mode' => 'open']);
        $specific = AccessRule::create($rules + ['level_id' => $entry->level_id, 'mode' => 'hidden']);
        $access = app(AcademicAccessService::class);

        $first = $access->permissions($entry);
        $this->assertFalse($first['documents_request']['visible']);
        $this->assertSame($access->decision($entry, 'documents_request'), $first['documents_request']);

        $specific->update(['is_active' => false]);
        $this->assertTrue($access->permissions($entry)['documents_request']['allowed']);
        $this->assertFalse($access->permissions($entry)['assignments_submit']['allowed']);
    }

    public function test_public_verification_preserves_no_referrer_and_denies_cross_site_framing(): void
    {
        $this->get(route('official-documents.verify', ['reference' => Str::uuid()]))
            ->assertNotFound()->assertHeader('Referrer-Policy', 'no-referrer')->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    public function test_slow_request_telemetry_logs_route_without_paths_or_identifiers(): void
    {
        config(['operations.http_log' => true, 'operations.http_slow_ms' => 0]);
        Route::get('/probe/{identifier}', fn () => response('probe'))->name('test.operation.probe');
        $id = null;
        Log::shouldReceive('warning')->once()->withArgs(function ($event, $context) use (&$id) {
            $id = $context['request_id'] ?? '';

            return $event === 'http.request.threshold' && array_keys($context) === ['request_id', 'route', 'status', 'duration_ms']
                && Str::isUuid($id) && $context['route'] === 'test.operation.probe' && $context['status'] === 200;
        });
        $response = $this->get('/probe/private-reference?private=secret')->assertOk();
        $response->assertHeader('X-Request-ID', $id);
    }

    public function test_production_preflight_refuses_a_vite_development_marker(): void
    {
        $directory = sys_get_temp_dir().'/umk-p14-public-'.Str::uuid();
        mkdir($directory, 0700);
        touch($directory.'/hot');
        $public = public_path();
        try {
            app()->usePublicPath($directory);
            $this->artisan('app:preflight', ['--production' => true, '--assets' => true])
                ->expectsOutput('Le marqueur Vite public/hot doit être absent de la release.')->assertFailed();
        } finally {
            app()->usePublicPath($public);
            unlink($directory.'/hot');
            rmdir($directory);
        }
    }

    public function test_runtime_probe_does_not_leave_a_cache_key(): void
    {
        $this->artisan('app:preflight', ['--runtime' => true])->assertSuccessful();
        $this->assertSame([], app('cache')->store('array')->getStore()->all());
    }
}
