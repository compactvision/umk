<?php

namespace App\Mail;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrollmentDocumentReplaced extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Enrollment $enrollment, public array $document) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'USK — Pièce à réexaminer · '.$this->enrollment->reference);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.transactional', text: 'emails.transactional-text', with: [
            'preheader' => 'Une nouvelle version d’un justificatif est disponible pour examen.',
            'eyebrow' => 'SERVICE DES INSCRIPTIONS', 'heading' => 'Une pièce attend votre examen.',
            'recipientName' => 'le service des inscriptions',
            'paragraphs' => ['Un candidat a remplacé un justificatif de son dossier. La nouvelle version est disponible dans le dashboard et doit faire l’objet d’un nouvel examen.'],
            'details' => ['Référence du dossier' => $this->enrollment->reference, 'Candidat' => TransactionalEmail::recipientName($this->enrollment->student), 'Formation' => $this->enrollment->level?->title ?? 'À préciser', 'Justificatif' => $this->document['filename'], 'Version' => $this->document['version'], 'État' => 'À réexaminer'],
            'actionUrl' => url('/dashboard/admin/enrollments/'.$this->enrollment->id.'?'.http_build_query(['document' => $this->document['uuid']])).'#review-document-'.$this->document['uuid'], 'actionLabel' => 'Examiner la nouvelle pièce',
            'noticeTitle' => 'Les documents restent dans le dashboard', 'notice' => 'Aucune pièce n’est jointe à cet email. Connectez-vous à votre compte administrateur pour consulter le justificatif et enregistrer votre verdict.',
            'signature' => 'La plateforme des inscriptions',
        ]);
    }
}
