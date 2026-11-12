<!DOCTYPE html>
<html lang="{{ isset($seo) ? $seo['lang'] : str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/png" href="/assets/usk/logo.png">
    <meta name="theme-color" content="#073e32">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @if(isset($seo))
        @include('seo.head')
    @else
        <title inertia>Université Simon Kimbangu</title>
        <meta name="robots" content="noindex, nofollow, noarchive" inertia="robots">
    @endif

    @if(!isset($seo) && str_starts_with($page['component'] ?? '', 'dashboard/') && !str_starts_with($page['component'] ?? '', 'dashboard/auth/') && data_get($page, 'props.auth.user'))
        <style>html[data-usk-theme-loading] body:has(#app:empty) { background: #0d151d; }</style>
        <script>
            (() => {
                let theme = 'system';
                try { theme = localStorage.getItem('usk-dashboard-theme') || 'system'; } catch {}
                if (theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-usk-theme-loading', '');
                }
            })();
        </script>
    @endif

    @routes
    @viteReactRefresh
    @php
        $vite = app(\Illuminate\Foundation\Vite::class);
        $entry = 'resources/js/app.tsx';
        $pageEntry = "resources/js/pages/{$page['component']}.tsx";
        try {
            $assets = $vite([$entry, $pageEntry]);
        } catch (\Illuminate\Foundation\ViteException) {
            // A page can be loaded by Inertia without its own manifest entry.
            $assets = $vite([$entry]);
        }
    @endphp
    {{ $assets }}
    @if(!isset($seo)) @inertiaHead @endif
</head>

<body class="font-sans antialiased">
    @if(isset($seo))
        @php($publicSsr = app(\Inertia\Ssr\Gateway::class)->dispatch($page))
        @if($publicSsr)
            {!! str_replace('id="app"', 'id="app" data-ssr="true"', $publicSsr->body) !!}
        @else
            <div id="app" data-page="{{ json_encode($page) }}">@include('seo.fallback')</div>
        @endif
    @else
        @inertia
    @endif
</body>

</html>
