<?php

namespace App\Modules\Seo\Application;

use Illuminate\Support\Facades\Http;
use Inertia\Ssr\BundleDetector;
use Inertia\Ssr\Gateway;
use Inertia\Ssr\Response;

class PublicSsrGateway implements Gateway
{
    public function dispatch(array $page): ?Response
    {
        if (! config('inertia.ssr.enabled') || ! (new BundleDetector)->detect()) {
            return null;
        }
        $url = rtrim(str_replace('/render', '', config('inertia.ssr.url')), '/').'/render';
        try {
            $render = Http::connectTimeout(1)->timeout(3)->post($url, $page)->throw()->json();
            if (! is_array($render) || ! isset($render['head'], $render['body']) || ! is_array($render['head']) || ! is_string($render['body'])) {
                return null;
            }

            return new Response(implode("\n", $render['head']), $render['body']);
        } catch (\Exception $exception) {
            return null; // The same public content remains available through the Blade fallback.
        }
    }
}
