<x-mail::message>
# Confirmation de réception de votre candidature

Bonjour {{ $studentName }},

Nous avons bien reçu votre candidature pour le niveau **{{ $levelName }}**.

@if($matricule)
Votre numéro de matricule est : **{{ $matricule }}**
@endif

## Prochaines étapes

Notre équipe administrative examine actuellement votre dossier. Nous vous contacterons dans les plus brefs délais pour vous informer de la suite du processus d'inscription.

**Date de soumission :** {{ $submittedAt }}

## Besoin d'aide ?

Si vous avez des questions concernant votre candidature, n'hésitez pas à nous contacter.

<x-mail::button :url="url('/dashboard/enrollments')">
Voir mes inscriptions
</x-mail::button>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
