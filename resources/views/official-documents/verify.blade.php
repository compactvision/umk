<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Vérification d’un document officiel</title>
    <style>
        body { margin: 0; background: #f3f6fa; color: #17263a; font: 1rem/1.55 system-ui, sans-serif; }
        main { margin: 3rem auto; max-width: 38rem; padding: 2rem; background: white; border: 1px solid #dbe3ec; border-radius: .65rem; }
        h1 { margin: 0 0 1rem; font-size: 1.6rem; }
        strong { display: inline-block; padding: .3rem .7rem; border: 1px solid currentColor; border-radius: .3rem; }
        dt { font-weight: 600; } dd { margin: 0 0 .75rem; overflow-wrap: anywhere; }
        @media (max-width: 42rem) { main { margin: .75rem; padding: 1rem; } }
    </style>
</head>
<body>
<main>
    <h1>Vérification d’un document officiel</h1>
    @if($record)
        @php($labels = ['valid' => 'Valide', 'revoked' => 'Révoqué', 'replaced' => 'Remplacé', 'expired' => 'Expiré', 'pending' => 'En attente de remise'])
        <p><strong>{{ $labels[$record['status']] }}</strong></p>
        <dl>
            <dt>Type</dt><dd>{{ $record['type'] }}</dd>
            <dt>Établissement</dt><dd>{{ $record['institution'] }}</dd>
            <dt>Référence officielle</dt><dd>{{ $record['number'] }}</dd>
            <dt>Date d’émission</dt><dd>{{ $record['issued_at']->copy()->timezone('Africa/Kinshasa')->format('d/m/Y') }}</dd>
            @if($record['expires_at'])<dt>Échéance</dt><dd>{{ $record['expires_at']->copy()->timezone('Africa/Kinshasa')->format('d/m/Y') }}</dd>@endif
        </dl>
        <p>Le statut provient du registre universitaire. Comparez la référence affichée à celle du document présenté.</p>
    @else
        <p>{{ $unavailable ? 'Vérification temporairement indisponible.' : 'Aucun document trouvé pour cette référence.' }}</p>
    @endif
</main>
</body>
</html>
