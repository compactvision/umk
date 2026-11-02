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

    @routes
    @viteReactRefresh    
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
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
