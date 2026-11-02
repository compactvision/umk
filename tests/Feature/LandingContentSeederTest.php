<?php

namespace Tests\Feature;

use App\Models\Faculty;
use App\Models\User;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use Database\Seeders\LandingContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LandingContentSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_preserves_existing_faculty_and_is_idempotent(): void
    {
        $admin = new User;
        $admin->forceFill(['first_name' => 'Test', 'last_name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password', 'email_verified_at' => now()])->save();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $medicine = Faculty::create(['name' => 'Faculté de Médecine', 'code' => 'MED', 'duration_years' => 5]);

        $this->seed(LandingContentSeeder::class);
        $article = PostModel::firstOrFail();
        $article->update(['excerpt' => 'Texte personnalisé à conserver']);
        $this->seed(LandingContentSeeder::class);

        $this->assertDatabaseCount('faculties', 5);
        $this->assertDatabaseCount('posts', 3);
        $this->assertDatabaseCount('categories', 3);
        $this->assertSame('Faculté de Médecine', $medicine->fresh()->name);
        $this->assertSame(5, $medicine->fresh()->duration_years);
        $this->assertSame('Texte personnalisé à conserver', $article->fresh()->excerpt);
        $this->assertSame(2, PostModel::whereNotNull('video_url')->count());
        $this->assertCount(3, PostModel::whereNull('video_url')->firstOrFail()->gallery);
        $this->get('/blog')->assertOk()->assertInertia(fn (Assert $page) => $page->has('posts.data', 3));
        $this->actingAs($admin)->get('/dashboard/admin/dashboard/blog/'.$article->slug)
            ->assertOk()->assertInertia(fn (Assert $page) => $page->where('post.main_image_1', $article->main_image_1));
    }
}
