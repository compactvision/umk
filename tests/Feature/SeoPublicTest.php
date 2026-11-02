<?php

namespace Tests\Feature;

use App\Models\Seo\LegalPage;
use App\Models\Seo\SeoPage;
use App\Models\Seo\SeoSetting;
use App\Models\User;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SeoPublicTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = new User;
        $user->forceFill(['first_name' => 'SEO', 'last_name' => 'Admin', 'email' => 'private-editor@example.test', 'password' => 'password', 'email_verified_at' => now()])->save();
        $user->assignRole(Role::findOrCreate('admin', 'web'));

        return $user;
    }

    private function article(User $author, string $status = 'published', mixed $published = null): PostModel
    {
        return PostModel::create(['uuid' => (string) Str::uuid(), 'author_id' => $author->id, 'title' => 'Article '.Str::uuid(), 'slug' => (string) Str::uuid(), 'excerpt' => 'Une activité académique vérifiée.', 'body' => '<p>Contenu publié.</p>', 'status' => $status, 'published_at' => $published ?? now(), 'gallery' => []]);
    }

    public function test_initial_html_contains_real_content_and_metadata_without_ssr(): void
    {
        config(['inertia.ssr.enabled' => false]);
        $response = $this->get('/');
        $response->assertOk()->assertSee('<html lang="fr">', false)->assertSee('<h1>', false)->assertSee('<meta name="description"', false)->assertSee('rel="canonical"', false)->assertHeader('X-Robots-Tag', 'noindex, follow');
        preg_match('#<script type="application/ld\+json"[^>]*>(.*?)</script>#s', $response->getContent(), $match);
        $json = json_decode($match[1], true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame('CollegeOrUniversity', $json['@graph'][0]['@type']);
        $this->assertStringNotContainsString('fonts.bunny.net', $response->getContent());
    }

    public function test_static_pages_have_unique_titles_and_descriptions(): void
    {
        $titles = $descriptions = [];
        foreach (array_keys(config('seo.pages')) as $path) {
            $html = $this->get($path)->assertOk()->getContent();
            preg_match('#<title[^>]*>(.*?)</title>#s', $html, $title);
            preg_match('#<meta name="description" content="([^"]+)"#', $html, $description);
            $titles[] = $title[1];
            $descriptions[] = $description[1];
            $this->assertSame(1, substr_count($html, '<h1>'), $path);
        }
        $this->assertCount(count($titles), array_unique($titles));
        $this->assertCount(count($descriptions), array_unique($descriptions));
    }

    public function test_only_published_current_news_are_public_and_sitemapped(): void
    {
        $author = $this->admin();
        $visible = $this->article($author);
        $draft = $this->article($author, 'draft');
        $future = $this->article($author, 'published', now()->addDays(3));
        $this->get('/')->assertOk()->assertSee($visible->title)->assertDontSee($draft->title)->assertDontSee($future->title);
        $this->get('/blog/'.$visible->id)->assertOk()->assertDontSee($author->email);
        $this->get('/blog/'.$draft->id)->assertNotFound()->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $xml = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8')->getContent();
        $parsed = simplexml_load_string($xml);
        $this->assertNotFalse($parsed);
        $this->assertStringContainsString('/blog/'.$visible->id.'</loc>', $xml);
        foreach (['/dashboard', '/login', '/blog/'.$draft->id.'</loc>', '/blog/'.$future->id.'</loc>'] as $private) {
            $this->assertStringNotContainsString($private, $xml);
        }
    }

    public function test_local_robots_deny_all_and_production_requires_opt_in(): void
    {
        config(['seo.indexable' => true, 'seo.origin' => 'https://campus.example']);
        $this->get('/robots.txt')->assertSee('Disallow: /');
        $this->get('/')->assertHeader('X-Robots-Tag', 'noindex, follow');
        $this->app->instance('env', 'production');
        $this->get('/robots.txt')->assertSee('Disallow: /dashboard')->assertSee('Sitemap: https://campus.example/sitemap.xml');
        $this->get('/')->assertHeader('X-Robots-Tag', 'index, follow, max-image-preview:large');
    }

    public function test_drafts_and_legal_identity_are_never_exposed(): void
    {
        LegalPage::create(['key' => 'privacy', 'title' => 'Confidentialité', 'content' => 'PRIVATE-DRAFT-SECRET', 'status' => 'draft']);
        SeoSetting::create(['values' => ['identity' => ['retention_policy' => 'INTERNAL-RETENTION-SECRET']]]);
        $this->get('/politique-de-confidentialite')->assertOk()->assertSee('en cours de validation')->assertDontSee('PRIVATE-DRAFT-SECRET')->assertDontSee('INTERNAL-RETENTION-SECRET')->assertHeader('X-Robots-Tag', 'noindex, follow');
        $this->get('/politique')->assertStatus(301)->assertRedirect('/politique-de-confidentialite');
        $this->get('/condition')->assertStatus(301)->assertRedirect('/conditions-generales-utilisation');
    }

    public function test_blog_pagination_is_self_canonical_and_rejects_empty_pages(): void
    {
        $author = $this->admin();
        for ($i = 0; $i < 13; $i++) {
            $this->article($author);
        }
        $this->get('/blog?page=2&utm_source=example')->assertOk()->assertSee('/blog?page=2" inertia="canonical"', false)->assertSee('page 2');
        $this->get('/blog?page=99')->assertNotFound();
    }

    public function test_admin_can_edit_metadata_but_cannot_index_private_routes_or_publish_incomplete_law(): void
    {
        $this->actingAs($this->admin());
        $this->get('/dashboard/admin/seo')->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $this->assertSame(6, LegalPage::where('status', 'draft')->count());
        $this->put('/dashboard/admin/seo/pages', ['path' => '/', 'title' => 'Un titre utile', 'description' => 'Description vérifiée.', 'indexable' => false])->assertSessionHasNoErrors();
        $this->get('/')->assertSee('Un titre utile');
        $this->put('/dashboard/admin/seo/pages', ['path' => '/dashboard', 'indexable' => true])->assertSessionHasErrors('path');
        $this->put('/dashboard/admin/seo/legal/privacy', ['content' => '[[registration]]', 'status' => 'published', 'approved' => true])->assertSessionHasErrors('content');
        $this->assertDatabaseHas('legal_pages', ['key' => 'privacy', 'status' => 'draft']);
    }

    public function test_guests_cannot_manage_seo_and_unknown_urls_have_real_404(): void
    {
        $this->get('/dashboard/admin/seo')->assertRedirect();
        $this->put('/dashboard/admin/seo/settings', [])->assertRedirect();
        $this->get('/does-not-exist')->assertNotFound()->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }

    public function test_metadata_cannot_inject_script_or_external_tracking_image(): void
    {
        SeoPage::create(['path' => '/', 'title' => '</title><script>alert(1)</script>', 'description' => '"/><script>alert(2)</script>', 'indexable' => true]);
        $html = $this->get('/')->assertOk()->getContent();
        $this->assertStringNotContainsString('<script>alert(1)</script>', $html);
        $this->actingAs($this->admin())->put('/dashboard/admin/seo/pages', ['path' => '/', 'image' => 'https://tracker.example/pixel', 'indexable' => true])->assertSessionHasErrors('image');
    }

    public function test_verified_student_cannot_read_or_change_admin_seo(): void
    {
        $user = $this->admin();
        $user->syncRoles([Role::findOrCreate('student', 'web')]);
        $this->actingAs($user)->get('/dashboard/admin/seo')->assertForbidden();
        $this->put('/dashboard/admin/seo/pages', ['path' => '/', 'indexable' => true])->assertForbidden();
        $this->assertDatabaseCount('seo_pages', 0);
    }

    public function test_ssr_outage_keeps_public_content_available(): void
    {
        config(['inertia.ssr.enabled' => true]);
        \Illuminate\Support\Facades\Http::fake(fn () => \Illuminate\Support\Facades\Http::response([], 503));
        $this->get('/')->assertOk()->assertSee('<h1>', false)->assertSee('Facultés et admissions');
    }

    public function test_audience_and_indexation_cannot_be_activated_without_prerequisites(): void
    {
        $this->actingAs($this->admin());
        $data = ['identity' => config('seo.identity'), 'origin' => '', 'indexable' => true];
        $this->put('/dashboard/admin/seo/settings', $data)->assertSessionHasErrors('origin');
        $data['indexable'] = false;
        $data['analytics_enabled'] = true;
        $this->put('/dashboard/admin/seo/settings', $data)->assertSessionHasErrors('analytics_enabled');
        $this->assertDatabaseCount('seo_settings', 0);
    }
}
