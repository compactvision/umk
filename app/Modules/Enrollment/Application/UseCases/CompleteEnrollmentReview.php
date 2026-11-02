<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use Illuminate\Support\Str;

final class CompleteEnrollmentReview
{
    public function __construct(private NotifyEnrollmentReview $notifications) {}

    /** Called inside the transaction holding the enrollment lock. */
    public function execute(Enrollment $entry, int $actor): void
    {
        $documents = $entry->documents()->orderBy('id')->get();
        if ($documents->isEmpty() || $documents->contains(fn ($doc) => ! in_array($doc->review_status, ['accepted', 'rejected', 'correction_requested'], true))) {
            if (! empty($entry->meta['analysis_completed_at'])) {
                $entry->meta = array_merge($entry->meta ?? [], ['analysis_completed_at' => null]);
                $entry->save();
            }

            return;
        }
        $signature = hash('sha256', $documents->map(fn ($doc) => [$doc->uuid, $doc->version, $doc->review_status, $doc->comment])->toJson());
        $previousReport = $entry->events()->where('event', 'analysis_completed')->where('payload->report_hash', $signature)->first();
        $entry->meta = array_merge($entry->meta ?? [], ['analysis_completed_at' => $previousReport?->occurred_at?->toISOString() ?? now()->toISOString()]);
        $entry->save();
        if ($previousReport) {
            return;
        }

        $accepted = $documents->where('review_status', 'accepted')->count();
        $corrections = $documents->where('review_status', 'correction_requested')->count();
        $rejected = $documents->where('review_status', 'rejected')->count();
        $summary = $accepted.' acceptée'.($accepted > 1 ? 's' : '').' · '.$corrections.' à corriger · '.$rejected.' refusée'.($rejected > 1 ? 's' : '');
        $remarks = [
            'Pièces examinées' => $documents->count().' sur '.$documents->count(),
            'Bilan de la vérification' => $summary,
        ];
        $labels = ['accepted' => 'Acceptée', 'rejected' => 'Refusée', 'correction_requested' => 'À corriger'];
        foreach ($documents as $index => $doc) {
            $title = Str::headline($doc->key ?: $doc->type);
            $remarks['Pièce '.($index + 1).' · '.$title.' · '.$doc->filename.' (v'.$doc->version.')'] = $labels[$doc->review_status].($doc->comment ? ' — '.$doc->comment : ' — Aucune remarque.');
        }
        $remarks['Prochaine étape'] = $corrections + $rejected > 0
            ? 'Certaines pièces nécessitent votre attention. Consultez les remarques dans vos justificatifs et utilisez le bouton de remplacement pour transmettre les pièces corrigées. La décision finale reste à venir.'
            : 'Toutes les pièces transmises ont été acceptées. Le service des inscriptions va prendre la décision finale sur votre candidature. Aucune action n’est requise à ce stade.';
        $entry->events()->create([
            'event' => 'analysis_completed', 'actor_id' => $actor, 'occurred_at' => now(),
            'payload' => ['report_hash' => $signature, 'reason' => 'L’examen de toutes les pièces est terminé. Compte rendu : '.$summary.'. La décision finale reste distincte.', 'total' => $documents->count(), 'accepted' => $accepted, 'corrections' => $corrections, 'rejected' => $rejected],
        ]);
        $this->notifications->afterCommit($entry->id, 'analysis_completed', $remarks);
    }
}
