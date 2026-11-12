<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{{ ['minutes' => 'Procès-verbal de délibération', 'report' => 'Bulletin officiel', 'transcript' => 'Relevé annuel officiel'][$kind] }}</title>
<style>
@page { margin: 38pt 38pt 48pt; }
body { font-family: DejaVu Sans, sans-serif; color: #17263a; font-size: 9pt; }
h1 { font-size: 18pt; margin: 10pt 0 6pt; }
h2 { font-size: 11pt; margin: 14pt 0 4pt; }
.meta { color: #445668; margin: 2pt 0; overflow-wrap: anywhere; }
.stamp { border: 1pt solid #946220; padding: 6pt; margin: 7pt 0; font-weight: bold; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; table-layout: fixed; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th, td { padding: 5pt 4pt; border-bottom: 1px solid #c8d4df; vertical-align: top; overflow-wrap: anywhere; }
th { text-align: left; background-color: #e8eff5; }
.small { font-size: 8pt; }
</style>
</head>
<body>
@php($context = $run->context)
@php($titles = ['minutes' => 'Procès-verbal de délibération', 'report' => 'Bulletin officiel', 'transcript' => 'Relevé annuel officiel'])
@php($labels = ['passed' => 'Validé', 'recognized' => 'Reconnu', 'compensated' => 'Compensé', 'failed' => 'Non validé', 'incomplete' => 'Incomplet', 'eliminatory' => 'Éliminatoire'])
@php($credits = static fn ($number) => number_format($number / 100, 2, ',', ' '))
<div class="meta">{{ $context['university'] }} · {{ $context['faculty'] }}</div>
<h1>{{ $titles[$kind] }}</h1>
@if($draft)<div class="stamp">PROVISOIRE · dossier de travail</div>@endif
<p class="meta">{{ $context['program'] }} · {{ $context['level'] }} · {{ $context['year'] }} · session {{ $context['session'] }}</p>
<p class="meta">Édition {{ $run->edition }}@if($volumes > 1) · Volume {{ $volume }} sur {{ $volumes }}@endif · Maquette {{ $context['curriculum'] }} · Règlement {{ $context['regulation_version'] }}</p>
<p class="meta small">Référence {{ $reference }} · {{ $context['regulation'] }}</p>
@if($run->approved_at)<p class="meta">Approuvé le {{ $run->approved_at->copy()->timezone('Africa/Kinshasa')->format('d/m/Y H:i') }}</p>@endif
@if($kind === 'minutes')
<h2>Jury du {{ $run->meeting_at->copy()->timezone('Africa/Kinshasa')->format('d/m/Y H:i') }}</h2>
<p>Présidence {{ $run->jury['members'][$run->jury['chair']] }} · Secrétariat {{ $run->jury['members'][$run->jury['secretary']] }}</p>
<p>Présents {{ collect($run->attendance ?? [])->map(fn ($id) => $run->jury['members'][$id])->implode(', ') ?: 'Appel en attente' }}</p>
<table><thead><tr><th style="width:32%">Étudiant</th><th style="width:17%">Matricule</th><th style="width:13%">Moyenne</th><th style="width:13%">Crédits</th><th>Décision</th></tr></thead><tbody>
@foreach($rows as $row)
<tr><td>{{ $row->snapshot['student'] }}</td><td>{{ $row->snapshot['matricule'] ?: '—' }}</td><td>{{ $row->snapshot['annual'] ?? '—' }}</td><td>{{ $credits($row->snapshot['credits']['earned']) }}</td><td>{{ $context['decisions'][$row->decision]['label'] ?? 'En attente' }}</td></tr>
@endforeach
</tbody></table>
@else
@foreach($rows as $row)
<h2>{{ $row->snapshot['student'] }} · {{ $row->snapshot['matricule'] ?: 'Matricule indisponible' }}</h2>
<p>Décision {{ $context['decisions'][$row->decision]['label'] }} · Moyenne annuelle {{ $row->snapshot['annual'] ?? '—' }} / {{ $credits($context['scale']) }}</p>
<p>Crédits acquis {{ $credits($row->snapshot['credits']['earned']) }} / {{ $credits($row->snapshot['credits']['planned']) }} {{ $context['credit_label'] }} · Crédits compensés {{ $credits($row->snapshot['credits']['compensated']) }}</p>
@foreach($row->snapshot['periods'] as $period)
<h2>{{ $period['name'] }} · Moyenne {{ $period['grade'] ?? '—' }}</h2>
<table><thead><tr><th style="width:44%">UE et éléments constitutifs</th><th style="width:12%">Note</th><th style="width:12%">Crédits</th><th style="width:13%">Coeff.</th><th>Situation</th></tr></thead><tbody>
@foreach($row->snapshot['units'] as $unit)
@if(in_array($unit['id'], $period['units'], true))
<tr><td><strong>{{ $unit['code'] }} · {{ $unit['name'] }}</strong></td><td>{{ $unit['grade'] ?? '—' }}</td><td>{{ $credits($unit['earned_credits']) }}</td><td>—</td><td>{{ $labels[$unit['status']] }}</td></tr>
@foreach($unit['items'] as $item)
<tr class="small"><td>{{ $item['code'] }} {{ $item['name'] }}</td><td>{{ $item['grade'] ?? '—' }}</td><td>{{ $item['credits'] === null ? '—' : $credits($item['credits']) }}</td><td>{{ $item['coefficient'] === null ? '—' : number_format($item['coefficient'] / 1000, 3, ',', ' ') }}</td><td>{{ $labels[$item['status']] }}</td></tr>
@endforeach
@endif
@endforeach
</tbody></table>
@endforeach
@endforeach
@endif
@if(!empty($qr))
<div style="page-break-inside: avoid; margin-top: 12pt">
    <img src="{{ $qr }}" style="width: 18mm" alt="QR de vérification">
    <p class="meta">Vérifier le statut sur {{ $verificationUrl }}</p>
</div>
@endif
</body>
</html>
