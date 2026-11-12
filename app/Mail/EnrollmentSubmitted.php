<?php

namespace App\Mail;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class EnrollmentSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Enrollment $enrollment
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from.address'), 'Université Simon Kimbangu'),
            subject: 'USK — Votre candidature a bien été reçue',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.enrollment.submitted',
            text: 'emails.transactional-text',
            with: [
                'preheader' => 'Votre dossier a été transmis au service des inscriptions de l’USK.',
                'eyebrow' => 'SUIVI DE VOTRE CANDIDATURE',
                'heading' => 'Votre projet prend forme.',
                'recipientName' => $this->enrollment->student ? TransactionalEmail::recipientName($this->enrollment->student) : 'Madame, Monsieur',
                'paragraphs' => ['Nous vous confirmons la réception de votre candidature à l’Université Simon Kimbangu. Vous pouvez retrouver votre dossier et suivre son évolution depuis votre espace candidat.'],
                'details' => array_filter([
                    'Formation' => $this->enrollment->level?->title,
                    'Année académique' => $this->enrollment->academicYear?->title,
                    'Référence du dossier' => $this->enrollment->reference,
                    'Matricule' => $this->enrollment->matricule,
                    'Date de réception' => (isset($this->enrollment->meta['submitted_at']) ? Carbon::parse($this->enrollment->meta['submitted_at']) : $this->enrollment->updated_at)?->timezone('Africa/Kinshasa')->format('d/m/Y à H:i').' (Kinshasa)',
                ], fn ($value) => $value !== null && $value !== ''),
                'actionUrl' => url('/dashboard/enrollments/'.$this->enrollment->uuid),
                'actionLabel' => 'Suivre ma candidature',
                'noticeTitle' => 'La prochaine étape',
                'notice' => 'Le service des inscriptions procédera à l’examen de votre dossier. Cet accusé de réception ne vaut pas confirmation d’admission. Consultez votre espace pour connaître l’état de votre demande.',
                'signature' => 'Le service des inscriptions',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
