<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{{ $template->title }}</title>
<style>
@page { margin: {{ $card ? (int) $layout['margin_mm'] : 16 }}mm; }
body { font-family: DejaVu Sans, sans-serif; margin: 0; color: #17263a; font-size: {{ $card ? '7.5' : '11' }}pt; }
h1 { font-size: {{ $card ? '11' : '23' }}pt; color: {{ $layout['color'] ?? '#203852' }}; margin: 0 0 4pt; }
p { margin: 0 0 6pt; }
.subtitle { color: #425466; font-size: {{ $card ? '7' : '10' }}pt; }
.rule { border-bottom: 1pt solid {{ $layout['color'] ?? '#203852' }}; margin: 4pt 0 8pt; }
.text { white-space: pre-wrap; overflow-wrap: break-word; }
.provisional { border: 1pt solid #8d570e; padding: 4pt; margin-bottom: 6pt; font-weight: bold; color: #68400e; }
.faces { page-break-after: always; }
.identity { width: 100%; border-collapse: collapse; }
.identity td { vertical-align: top; }
.photo { width: 15mm; height: 18mm; }
.qr { width: {{ $card ? '17' : '24' }}mm; }
.signature { max-width: 35mm; max-height: 13mm; }
.logo { max-width: 21mm; max-height: 12mm; }
.meta { color: #425466; font-size: {{ $card ? '6' : '8' }}pt; }
.verify { margin-top: 9pt; page-break-inside: avoid; }
</style>
</head>
<body>
@if($card)
<div class="faces">
    <p class="subtitle">{{ $values['institution'] }}</p>
    <h1>{{ $template->title }}</h1>
    @if(!$document)<p class="provisional">APERÇU PROVISOIRE</p>@endif
    <table class="identity"><tr><td style="width:17mm"><img class="photo" src="{{ $photo }}" alt="Photo"></td><td>
        <strong>{{ $values['student'] }}</strong><br>Matricule {{ $values['matricule'] }}<br>
        {{ $values['faculty'] }} · {{ $values['level'] }}<br>{{ $values['year'] }}<br>
        <span class="meta">{{ $values['number'] }}</span>
    </td></tr></table>
</div>
<p class="subtitle">{{ $values['institution'] }}</p>
<div class="rule"></div>
<table class="identity"><tr><td>
    @if(!empty($values['previous_number']))
<p class="meta">{{ $values['issuance_action'] === 'duplicate' ? 'Duplicata' : 'Rectification' }} · {{ $values['previous_number'] }}</p>
@endif
<p class="text">{{ $body }}</p>
    <p class="meta">{{ $values['signer'] }} · {{ $values['capacity'] }}</p>
    @if($document)
    <p class="meta">Émise le {{ $values['issued_on'] }}@if($document->expires_at) · Expire le {{ $document->expires_at->copy()->timezone('Africa/Kinshasa')->format('d/m/Y') }}@endif</p>
    @endif
</td>@if($qr)<td style="width:18mm"><img class="qr" src="{{ $qr }}" alt="QR de vérification"></td>@endif</tr></table>
@else
@if($images->has('logo'))<img class="logo" src="{{ $images['logo'] }}" alt="Logo">@endif
<p class="subtitle">{{ $values['institution'] }} · {{ $values['faculty'] }}</p>
<h1>{{ $template->title }}</h1>
<div class="rule"></div>
@if(!$document)<p class="provisional">APERÇU PROVISOIRE · SANS VALEUR D’ÉMISSION</p>@endif
<p class="meta">Référence {{ $values['number'] }} · Modèle version {{ $template->version }}@if($document) · Émis le {{ $values['issued_on'] }}@endif</p>
@if(!empty($values['previous_number']))
<p class="meta">{{ $values['issuance_action'] === 'duplicate' ? 'Duplicata' : 'Rectification' }} · {{ $values['previous_number'] }}</p>
@endif
<p class="text">{{ $body }}</p>
<p><strong>{{ $values['signer'] }}</strong><br>{{ $values['capacity'] }}</p>
@if($document)
    @foreach(['signature', 'stamp'] as $asset)
        @if($images->has($asset))<img class="signature" src="{{ $images[$asset] }}" alt="Marque institutionnelle">@endif
    @endforeach
    <div class="verify">
        <img class="qr" src="{{ $qr }}" alt="QR de vérification">
        <p class="meta">Vérifier le statut sur {{ $url }}</p>
    </div>
@endif
@endif
</body>
</html>
