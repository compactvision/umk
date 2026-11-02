<?php

namespace App\Http\Middleware;

use App\Modules\Seo\Application\PublicPage;
use Closure;
use Illuminate\Http\Request;

class SeoResponse
{
    public function handle(Request $request, Closure $next)
    {
        if (app()->environment('production') && config('seo.enforce_origin') && in_array($request->method(), ['GET', 'HEAD'])) {
            $origin = app(PublicPage::class)->origin();
            if (rtrim($request->getSchemeAndHttpHost(), '/') !== $origin) {
                return redirect()->away($origin.$request->getRequestUri(), 301);
            }
        }
        $originalSsr = config('inertia.ssr.enabled');
        $public = str_starts_with((string) $request->route()?->getName(), 'legal.') || in_array($request->route()?->getName(), ['home', 'about', 'courses', 'admission', 'contact', 'blog', 'blog.show', 'courseShow', 'faculties.show', 'tuitions', 'legal', 'site-plan']);
        if (! $public) {
            config(['inertia.ssr.enabled' => false]);
        }
        try {
            $response = $next($request);
        } finally {
            config(['inertia.ssr.enabled' => $originalSsr]);
        }
        $seo = $request->attributes->get('seo');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        if ($seo) {
            $response->headers->set('X-Robots-Tag', $response->getStatusCode() >= 400 ? 'noindex, nofollow' : $seo['robots']);
            $response->headers->set('Link', '<'.$seo['canonical'].'>; rel="canonical"', false);
        } elseif (! in_array($request->route()?->getName(), ['seo.sitemap', 'seo.robots'])) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        }
        if (! $public) {
            $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
        }

        return $response;
    }
}
