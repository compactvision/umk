<?php

namespace App\Mail;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrollmentReviewUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Enrollment $enrollment, public string $kind, public array $remarks = []) {}

    private function wording(): array
    {
        return match ($this->kind) {
            'analysis_started' => ['L’examen de votre dossier a commencé', 'Votre dossier est en cours d’examen.', 'Le service des inscriptions vient de commencer l’analyse de votre candidature. Les informations et les justificatifs transmis vont être examinés. Aucune action n’est requise de votre part à ce stade.'],
            'analysis_completed' => ['Votre dossier a été vérifié — compte rendu', 'Vos pièces ont été examinées.', 'Le service des inscriptions a terminé l’examen de toutes les pièces actuellement transmises dans votre dossier. Retrouvez ci-dessous le bilan détaillé, les remarques et la prochaine étape. Ce compte rendu de vérification précède la décision finale d’admission.'],
            'corrections_requested' => ['Des pièces de votre dossier sont à compléter', 'Précisons votre candidature.', 'Après examen, certaines pièces nécessitent une correction ou un remplacement. Consultez les remarques ci-dessous, puis ouvrez votre dossier pour transmettre les nouveaux justificatifs.'],
            'validated' => ['Votre dossier d’inscription a été validé', 'Votre dossier a été validé.', 'Le service des inscriptions a validé votre dossier. Votre espace étudiant est désormais activé : retrouvez votre faculté, votre niveau, votre année académique et le suivi de vos frais. Connectez-vous avec vos identifiants habituels.'],
            'rejected' => ['Décision concernant votre candidature', 'Une décision sur votre dossier.', 'Après examen de votre candidature, le service des inscriptions ne peut pas donner une suite favorable à votre demande. Le motif de cette décision est précisé ci-dessous. Vous pouvez contacter le service pour obtenir des précisions.'],
        };
    }

    public function envelope(): Envelope
    {
        return new Envelope(from: new Address(config('mail.from.address'), 'Université Simon Kimbangu'), subject: 'USK — '.$this->wording()[0]);
    }

    public function content(): Content
    {
        [, $heading, $paragraph] = $this->wording();

        return new Content(view: 'emails.transactional', text: 'emails.transactional-text', with: [
            'preheader' => $this->wording()[0], 'eyebrow' => 'SUIVI DE VOTRE INSCRIPTION', 'heading' => $heading,
            'recipientName' => TransactionalEmail::recipientName($this->enrollment->student), 'paragraphs' => [$paragraph],
            'details' => array_merge(['Formation' => $this->enrollment->level?->title ?? 'À préciser', 'Référence du dossier' => $this->enrollment->reference], $this->remarks),
            'actionUrl' => $this->kind === 'validated' ? url('/dashboard/student?application='.$this->enrollment->uuid.'&welcome=1') : url('/dashboard/enrollments/'.$this->enrollment->uuid), 'actionLabel' => $this->kind === 'validated' ? 'Accéder à mon espace étudiant' : 'Consulter mon dossier',
            'noticeTitle' => 'Votre espace de suivi',
            'notice' => $this->kind === 'validated' ? 'La validation du dossier ne modifie pas votre situation de paiement. Suivez les modalités communiquées par l’université.' : 'Vous retrouverez les remarques et l’historique de votre dossier dans votre espace. Ne transmettez pas de justificatifs sensibles par retour d’email.',
            'signature' => 'Le service des inscriptions',
        ]);
    }
}
