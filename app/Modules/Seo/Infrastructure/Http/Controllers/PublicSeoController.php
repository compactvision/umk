<?php

namespace App\Modules\Seo\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Seo\SeoPage;
use App\Modules\Seo\Application\PublicCatalog;
use App\Modules\Seo\Application\PublicPage;
use App\Modules\Seo\Application\SeoRepository;
use Illuminate\Support\Facades\Schema;

class PublicSeoController extends Controller
{
    public function sitemap(PublicCatalog $catalog, PublicPage $page)
    {
        $overrides = Schema::hasTable('seo_pages') ? SeoPage::all()->keyBy('path') : collect();
        $urls = collect($catalog->entries())->filter(fn ($entry) => ($overrides->get($entry['path'])?->indexable ?? true) && (! $overrides->get($entry['path'])?->canonical_path || $overrides->get($entry['path'])->canonical_path === $entry['path']));

        return response()->view('seo.sitemap', ['urls' => $urls, 'origin' => $page->origin()])->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function robots(PublicPage $page, SeoRepository $repository)
    {
        $enabled = app()->environment('production') && ($repository->settings()['indexable'] ?? config('seo.indexable'));
        $text = "User-agent: *\n".($enabled ? "Disallow: /dashboard\nDisallow: /login\nDisallow: /register\nDisallow: /auth/\nDisallow: /email/\nDisallow: /forgot-password\nDisallow: /reset-password\nDisallow: /test\nDisallow: /api/\nDisallow: /analytics/\n" : "Disallow: /\n");

        return response($text.'Sitemap: '.$page->origin()."/sitemap.xml\n")->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function legal(string $key, PublicPage $page, SeoRepository $repository)
    {
        $definition = config('seo.legal')[$key] ?? abort(404);
        $document = $repository->legal($key);
        $approved = $document?->status === 'published' && $document->approved_at;

        return $page->render('legal/LegalPage', ['document' => ['title' => $definition['title'], 'status' => $approved ? 'published' : 'pending', 'content' => $approved ? $document->content : null, 'updated_at' => $approved ? $document->approved_at->toDateString() : null]], ['title' => $definition['title'], 'heading' => $definition['title'], 'description' => $approved ? $definition['title'].' de l’Université Simon Kimbangu : informations et modalités applicables au site.' : 'Les informations de cette page sont en cours de validation par l’établissement.', 'indexable' => false]);
    }

    public function plan(PublicCatalog $catalog, PublicPage $page)
    {
        return $page->render('legal/SitePlan', ['links' => array_values($catalog->entries())]);
    }
}
