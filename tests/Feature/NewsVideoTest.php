<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NewsVideoTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = new User;
        $user->forceFill(['first_name' => 'Test', 'last_name' => 'Editeur', 'email' => 'editor@example.test', 'password' => 'password', 'email_verified_at' => now()])->save();
        $user->assignRole(Role::findOrCreate('admin', 'web'));

        return $user;
    }

    private function article(User $user, array $attributes = []): PostModel
    {
        return PostModel::create(array_merge(['uuid' => (string) Str::uuid(), 'author_id' => $user->id, 'title' => 'Une rencontre scientifique', 'slug' => (string) Str::uuid(), 'status' => 'published', 'published_at' => now(), 'gallery' => []], $attributes));
    }

    public function test_admin_can_create_video_article_and_it_appears_publicly(): void
    {
        $this->actingAs($this->admin())->post('/dashboard/admin/posts', ['title' => 'Conférence en vidéo', 'status' => 'published', 'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'])->assertSessionHasNoErrors()->assertRedirect();
        $post = PostModel::firstOrFail();
        $this->assertSame('https://www.youtube.com/watch?v=dQw4w9WgXcQ', $post->video_url);
        $this->get('/blog')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Blogpage')->where('posts.data.0.video_url', $post->video_url));
        $this->get('/blog/'.$post->id)->assertOk()->assertInertia(fn (Assert $page) => $page->component('BlogDetailsPage')->where('post.video_url', $post->video_url));
    }

    public function test_upload_is_stored_and_unrelated_edit_preserves_it_then_it_can_be_removed(): void
    {
        Storage::fake('public');
        $user = $this->admin();
        $this->actingAs($user)->post('/dashboard/admin/posts', ['title' => 'Reportage campus', 'status' => 'draft', 'video_file' => UploadedFile::fake()->create('campus.mp4', 100, 'video/mp4'), 'gallery' => [UploadedFile::fake()->image('photo.jpg')]])->assertSessionHasNoErrors();
        $post = PostModel::firstOrFail();
        Storage::disk('public')->assertExists($post->video_url);
        $this->assertCount(1, $post->gallery);
        $original = $post->video_url;
        $this->put('/dashboard/admin/posts/'.$post->id, ['title' => 'Nouveau titre'])->assertSessionHasNoErrors();
        $this->assertSame($original, $post->fresh()->video_url);
        $this->put('/dashboard/admin/posts/'.$post->id, ['video_url' => 'https://vimeo.com/123456789'])->assertSessionHasNoErrors();
        $this->assertSame('https://vimeo.com/123456789', $post->fresh()->video_url);
        $this->put('/dashboard/admin/posts/'.$post->id, ['remove_video' => true])->assertSessionHasNoErrors();
        $this->assertNull($post->fresh()->video_url);
    }

    public function test_invalid_links_and_non_video_uploads_are_rejected(): void
    {
        $this->actingAs($this->admin());
        foreach (['javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://example.com/page', 'http://example.com/video.mp4'] as $url) {
            $this->post('/dashboard/admin/posts', ['title' => 'Test', 'status' => 'draft', 'video_url' => $url])->assertSessionHasErrors('video_url');
        }
        $this->post('/dashboard/admin/posts', ['title' => 'Test', 'status' => 'draft', 'video_file' => UploadedFile::fake()->create('document.pdf', 10, 'application/pdf')])->assertSessionHasErrors('video_file');
        $this->post('/dashboard/admin/posts', ['title' => 'Test', 'status' => 'draft', 'video_file' => UploadedFile::fake()->create('large.mp4', 102401, 'video/mp4')])->assertSessionHasErrors('video_file');
    }

    public function test_drafts_archives_and_future_publications_are_not_public(): void
    {
        $user = $this->admin();
        foreach ([['status' => 'draft'], ['status' => 'archived'], ['published_at' => now()->addDay()]] as $attributes) {
            $post = $this->article($user, $attributes);
            $this->get('/blog/'.$post->id)->assertNotFound();
        }
        $this->get('/blog')->assertOk()->assertInertia(fn (Assert $page) => $page->has('posts.data', 0));
    }

    public function test_detail_includes_safe_text_and_only_published_related_articles(): void
    {
        $user = $this->admin();
        $post = $this->article($user, ['content' => '<p>Premier paragraphe.</p><p>Deuxième paragraphe.</p>']);
        $other = $this->article($user);
        $this->article($user, ['status' => 'draft']);
        $this->get('/blog/'.$post->id)->assertOk()->assertInertia(fn (Assert $page) => $page->where('post.body_text', "Premier paragraphe.\n\nDeuxième paragraphe.\n\n")->has('related', 1)->where('related.0.id', $other->id));
    }

    public function test_student_cannot_publish_video(): void
    {
        $user = $this->admin();
        $user->syncRoles([]);
        $this->actingAs($user)->post('/dashboard/admin/posts', ['title' => 'Test', 'status' => 'published', 'video_url' => 'https://example.com/video.mp4'])->assertForbidden();
    }
}
