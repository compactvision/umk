<?php

namespace App\Modules\Seo\Application;

use Illuminate\Support\Str;
use Inertia\Inertia;

class PublicPage
{
    public function __construct(private SeoRepository $repository) {}

    public function origin(): string
    {
        $configured = $this->repository->settings()['origin'] ?? config('seo.origin');

        return rtrim($configured ?: (app()->environment('production') ? config('app.url') : request()->getSchemeAndHttpHost()), '/');
    }

    public function absolute(?string $path): string
    {
        if (! $path) {
            return $this->origin().'/assets/usk/campus.jpg';
        }
        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return $this->origin().(str_starts_with($path, '/') ? $path : '/storage/'.$path);
    }

    public function render(string $component, array $props = [], array $custom = [])
    {
        $path = '/'.trim(request()->path(), '/');
        $defaults = config('seo.pages')[$path] ?? ['title' => 'Université Simon Kimbangu', 'description' => 'Informations de l’Université Simon Kimbangu à Kinshasa.', 'heading' => 'Université Simon Kimbangu'];
        $data = array_replace($defaults, $custom);
        $override = $this->repository->page($path);
        foreach (['title', 'description', 'image'] as $key) {
            if ($override?->$key) {
                $data[$key] = $override->$key;
            }
        }
        $title = Str::limit(trim(strip_tags($data['title'])), 180, '');
        if (! str_contains($title, 'Université Simon Kimbangu')) {
            $title .= ' — Université Simon Kimbangu';
        }
        $description = Str::limit(preg_replace('/\s+/u', ' ', trim(strip_tags($data['description']))), 300, '…');
        $canonicalPath = $override?->canonical_path ?: $path;
        $page = $path === '/blog' ? max(1, (int) request('page', 1)) : 1;
        if ($page > 1) {
            $canonicalPath .= '?page='.$page;
            $title = 'Actualités · page '.$page.' — Université Simon Kimbangu';
            $description = 'Page '.$page.' des actualités publiées de l’Université Simon Kimbangu. Recherche, activités académiques et vie universitaire à Kinshasa.';
        }
        $canonical = $this->origin().$canonicalPath;
        $enabled = (bool) ($this->repository->settings()['indexable'] ?? config('seo.indexable'));
        $indexable = app()->environment('production') && $enabled && ($custom['indexable'] ?? true) && ($override?->indexable ?? true);
        $identity = $this->repository->identity();
        $organization = ['@type' => 'CollegeOrUniversity', '@id' => $this->origin().'/#university', 'name' => $identity['name'], 'url' => $this->origin().'/', 'logo' => $this->absolute('/assets/usk/logo.png'), 'telephone' => $identity['phone'], 'email' => $identity['email'], 'address' => ['@type' => 'PostalAddress', 'streetAddress' => $identity['address'], 'addressLocality' => $identity['city'], 'addressCountry' => $identity['country']]];
        $graph = [$organization, ['@type' => 'WebSite', '@id' => $this->origin().'/#website', 'url' => $this->origin().'/', 'name' => $identity['name'], 'inLanguage' => 'fr', 'publisher' => ['@id' => $organization['@id']]], ['@type' => 'WebPage', '@id' => $canonical.'#page', 'url' => $canonical, 'name' => $title, 'description' => $description, 'inLanguage' => 'fr', 'isPartOf' => ['@id' => $this->origin().'/#website']]];
        if ($path !== '/') {
            $graph[] = ['@type' => 'BreadcrumbList', 'itemListElement' => [['@type' => 'ListItem', 'position' => 1, 'name' => 'Accueil', 'item' => $this->origin().'/'], ['@type' => 'ListItem', 'position' => 2, 'name' => $data['heading'] ?? $title, 'item' => $canonical]]];
        }
        if (isset($custom['schema'])) {
            $graph[] = $custom['schema'];
        }
        $seo = ['title' => $title, 'description' => $description, 'heading' => $data['heading'] ?? $title, 'canonical' => $canonical, 'robots' => $indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow', 'image' => $this->absolute($data['image'] ?? null), 'type' => $data['type'] ?? 'website', 'lang' => 'fr', 'schema' => ['@context' => 'https://schema.org', '@graph' => $graph], 'verification' => $this->repository->settings()['search_console'] ?? config('seo.search_console')];
        request()->attributes->set('seo', $seo);

        return Inertia::render($component, $props + ['seo' => $seo, 'publicSettings' => $this->repository->publicSettings()])->withViewData('seo', $seo);
    }
}
