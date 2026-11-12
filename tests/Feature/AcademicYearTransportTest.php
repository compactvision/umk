<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Vite;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicYearTransportTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = (new User)->forceFill(['first_name' => 'Admin', 'last_name' => 'Transport', 'email' => 'transport@example.test', 'password' => 'password', 'email_verified_at' => now()]);
        $user->save();
        $user->assignRole(Role::findOrCreate('admin', 'web'));

        return $user;
    }

    public function test_compiled_dashboard_headers_stay_small(): void
    {
        Vite::useHotFile(storage_path('framework/transport-test.hot'));
        $response = $this->actingAs($this->admin())->get('/dashboard/admin/academic-years')->assertOk();
        $bytes = strlen(implode(', ', $response->headers->all('Link')));
        $this->assertLessThan(4096, $bytes, 'Link preload header: '.$bytes.' bytes');
        $response->assertSee('rel="modulepreload"', false);
    }

    public function test_compiled_inertia_page_can_load_without_a_separate_manifest_entry(): void
    {
        $publicPath = public_path();
        $fixture = sys_get_temp_dir().'/umk-vite-'.bin2hex(random_bytes(8));
        File::ensureDirectoryExists($fixture.'/build');
        File::put($fixture.'/build/manifest.json', json_encode([
            'resources/js/app.tsx' => ['file' => 'assets/app-fixture.js', 'src' => 'resources/js/app.tsx', 'isEntry' => true],
        ], JSON_THROW_ON_ERROR));

        try {
            $this->app->usePublicPath($fixture);
            Vite::useHotFile($fixture.'/hot');
            $this->actingAs($this->admin())->get('/dashboard/admin/academic-years')->assertOk()
                ->assertSee('/build/assets/app-fixture.js')
                ->assertInertia(fn (Assert $page) => $page->component('dashboard/academicYear/Index'));
        } finally {
            $this->app->usePublicPath($publicPath);
            File::deleteDirectory($fixture);
        }
    }

    public function test_open_and_close_are_repeatable_and_never_open_two_years(): void
    {
        $this->actingAs($this->admin());
        $year = AcademicYear::create(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'draft']);
        $other = AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'draft']);
        $url = '/dashboard/admin/academic-years/'.$year->id;
        $this->from('/dashboard/admin/academic-years')->withHeader('X-Inertia', 'true')->patch($url.'/open')->assertStatus(303)->assertSessionHasNoErrors();
        $this->patch($url.'/open')->assertSessionHasNoErrors();
        $this->patch('/dashboard/admin/academic-years/'.$other->id.'/open')->assertSessionHasErrors('general');
        $this->assertSame(1, AcademicYear::where('status', 'open')->count());
        $this->patch($url.'/close')->assertSessionHasNoErrors();
        $this->patch($url.'/close')->assertSessionHasNoErrors();
        $this->patch('/dashboard/admin/academic-years/'.$other->id.'/open')->assertSessionHasNoErrors();
        $this->assertSame('open', $other->fresh()->status);
    }

    public function test_missing_or_invalid_key_returns_a_clean_503_without_sessions(): void
    {
        foreach (['', 'base64:invalid'] as $key) {
            config(['app.key' => $key]);
            $this->get('/dashboard/admin/academic-years')->assertStatus(503)->assertDontSee('APP_KEY')->assertHeaderMissing('Set-Cookie');
            $this->patchJson('/dashboard/admin/academic-years/1/open')->assertStatus(503)->assertJsonStructure(['message']);
        }
    }

    public function test_preflight_rejects_empty_key_and_never_regenerates_it(): void
    {
        config(['app.key' => '']);
        $this->artisan('app:preflight')->assertExitCode(1);
        $this->assertSame('', config('app.key'));
    }

    public function test_valid_configuration_passes_preflight(): void
    {
        $this->artisan('app:preflight')->assertSuccessful();
    }

    public function test_missing_or_malformed_year_is_reported_without_server_error(): void
    {
        $this->actingAs($this->admin());
        $this->get('/dashboard/admin/academic-years/not-a-number')->assertNotFound();
        $this->put('/dashboard/admin/academic-years/999', ['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30'])->assertRedirect()->assertSessionHasErrors('general');
    }
}
