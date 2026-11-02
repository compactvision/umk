<title inertia>{{ $seo['title'] }}</title>
<meta name="description" content="{{ $seo['description'] }}" inertia="description">
<link rel="canonical" href="{{ $seo['canonical'] }}" inertia="canonical">
<meta name="robots" content="{{ $seo['robots'] }}" inertia="robots">
<meta property="og:locale" content="fr_CD" inertia="og:locale">
<meta property="og:site_name" content="Université Simon Kimbangu" inertia="og:site_name">
<meta property="og:title" content="{{ $seo['title'] }}" inertia="og:title">
<meta property="og:description" content="{{ $seo['description'] }}" inertia="og:description">
<meta property="og:url" content="{{ $seo['canonical'] }}" inertia="og:url">
<meta property="og:type" content="{{ $seo['type'] }}" inertia="og:type">
<meta property="og:image" content="{{ $seo['image'] }}" inertia="og:image">
<meta property="og:image:alt" content="Université Simon Kimbangu" inertia="og:image:alt">
<meta name="twitter:card" content="summary_large_image" inertia="twitter:card">
<meta name="twitter:title" content="{{ $seo['title'] }}" inertia="twitter:title">
<meta name="twitter:description" content="{{ $seo['description'] }}" inertia="twitter:description">
<meta name="twitter:image" content="{{ $seo['image'] }}" inertia="twitter:image">
@if($seo['verification'])<meta name="google-site-verification" content="{{ $seo['verification'] }}" inertia="google-verification">@endif
<script type="application/ld+json" inertia="structured-data">{!! json_encode($seo['schema'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>
