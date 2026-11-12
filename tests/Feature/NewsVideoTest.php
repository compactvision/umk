<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\CategoryModel;
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

    public function test_blog_filters_apply_before_pagination_and_direct_form_routes_open_existing_modals(): void
    {
        $admin = $this->admin();
        $category = CategoryModel::create(['name' => 'Recherche', 'slug' => 'recherche']);
        $post = $this->article($admin, ['category_id' => $category->id, 'status' => 'draft']);
        $this->article($admin, ['category_id' => $category->id]);
        $this->article($admin, ['status' => 'draft']);
        $this->article($admin, ['category_id' => $category->id, 'status' => 'draft', 'title' => 'Sport']);

        $this->actingAs($admin)->get(route('dashboard.admin.posts.index', [
            'q' => 'scientifique', 'category_id' => $category->id, 'status' => 'draft',
        ]))->assertInertia(fn (Assert $page) => $page->component('dashboard/blog/Index')
            ->where('filters.category_id', (string) $category->id)->where('posts.total', 1)->where('posts.data.0.id', $post->id));

        $create = route('dashboard.admin.posts.index', ['create' => 1]);
        $this->get(route('dashboard.admin.posts.create'))->assertRedirect($create);
        $this->get($create)->assertInertia(fn (Assert $page) => $page->component('dashboard/blog/Index')->where('openCreate', true));

        $edit = route('dashboard.admin.posts.show', ['slug' => $post->slug, 'edit' => 1]);
        $this->get(route('dashboard.admin.posts.edit', $post))->assertRedirect($edit);
        $this->get($edit)->assertInertia(fn (Assert $page) => $page->component('dashboard/blog/Show')
            ->where('openEdit', true)->where('categories.0.id', $category->id)->where('can.update', true));
        $post->update(['read_time' => '7 min', 'published_at' => now()->addDay()]);
        $this->put(route('dashboard.admin.posts.update', $post), [
            'category_id' => '', 'excerpt' => '', 'published_at' => '',
        ])->assertSessionHasNoErrors();
        $updated = $post->fresh();
        $this->assertNull($updated->category_id);
        $this->assertNull($updated->excerpt);
        $this->assertNull($updated->published_at);
        $this->assertSame('7 min', $updated->read_time);
    }

    public function test_admin_can_delete_an_article_and_student_cannot_open_its_form_or_delete_it(): void
    {
        $admin = $this->admin();
        $post = $this->article($admin);
        $student = User::factory()->create();
        $student->assignRole(Role::findOrCreate('student', 'web'));

        $this->actingAs($student)->get(route('dashboard.admin.posts.create'))->assertForbidden();
        $this->get(route('dashboard.admin.posts.edit', $post))->assertForbidden();
        $this->delete(route('dashboard.admin.posts.destroy', $post))->assertForbidden();
        $this->assertModelExists($post);

        $this->actingAs($admin)->delete(route('dashboard.admin.posts.destroy', $post))
            ->assertRedirect(route('dashboard.admin.posts.index'))->assertSessionHas('success');
        $this->assertModelMissing($post);
        $this->delete(route('dashboard.admin.posts.destroy', $post))->assertNotFound();
    }

    public function test_gallery_removal_and_metadata_updates_are_applied_only_to_the_selected_revision(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $gallery = [
            ['path' => 'posts/gallery/first.jpg', 'alt' => 'Premier'],
            ['path' => 'posts/gallery/second.jpg', 'alt' => 'Second', 'caption' => 'Conserver'],
        ];
        $post = $this->article($admin, ['gallery' => $gallery]);
        $show = route('dashboard.admin.posts.show', $post->slug);
        $update = route('dashboard.admin.posts.update', $post);
        $this->actingAs($admin)->get($show)->assertInertia(fn (Assert $page) => $page
            ->where('post.gallery.0.id', 1)->where('post.gallery.1.id', 2)->has('galleryRevision'));
        $revision = hash('sha256', json_encode($gallery, JSON_THROW_ON_ERROR));
        $this->put($update, [
            'gallery_revision' => $revision,
            'removed_gallery_ids' => [1],
            'gallery_existing_meta' => [['id' => 2, 'alt' => 'Modifié']],
            'gallery' => [UploadedFile::fake()->image('third.jpg')],
        ])->assertSessionHasNoErrors();
        $updated = $post->fresh()->gallery;
        $this->assertCount(2, $updated);
        $this->assertSame(['path' => $gallery[1]['path'], 'alt' => 'Modifié', 'caption' => 'Conserver'], $updated[0]);
        Storage::disk('public')->assertExists($updated[1]['path']);

        $this->put($update, [
            'gallery_revision' => $revision,
            'removed_gallery_ids' => [1],
            'gallery' => [UploadedFile::fake()->image('stale.jpg')],
        ])->assertSessionHasErrors('gallery_revision');
        $this->assertSame($updated, $post->fresh()->gallery);
        $this->assertCount(1, Storage::disk('public')->allFiles('blog/gallery'));
    }
}
