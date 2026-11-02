<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use Illuminate\Support\Facades\DB;

final class ReviewEnrollment
{
    public function __construct(private NotifyEnrollmentReview $notifications) {}

    private function requireAnalysis(Enrollment $enrollment): void
    {
        if ($enrollment->status !== EnrollmentStatus::PENDING || empty($enrollment->meta['analysis_started_at'])) {
            throw new InvalidEnrollmentStateException('Commencez l’analyse avant d’examiner les pièces. Un dossier clôturé ne peut plus être modifié.');
        }
    }

    public function start(int $id, int $actor): bool
    {
        return DB::transaction(function () use ($id, $actor) {
            $entry = Enrollment::lockForUpdate()->findOrFail($id);
            if (! in_array($entry->status, [EnrollmentStatus::SUBMITTED, EnrollmentStatus::PENDING], true)) {
                throw new InvalidEnrollmentStateException('Seul un dossier soumis peut être mis en analyse.');
            }
            if (! empty($entry->meta['analysis_started_at'])) {
                return false;
            }
            $entry->status = EnrollmentStatus::PENDING;
            $entry->meta = array_merge($entry->meta ?? [], ['analysis_started_at' => now()->toISOString(), 'analysis_started_by' => $actor]);
            $entry->save();
            $entry->events()->create(['event' => 'analysis_started', 'actor_id' => $actor, 'occurred_at' => now()]);
            $this->notifications->afterCommit($id, 'analysis_started');

            return true;
        });
    }

    public function document(int $id, string $uuid, int $actor, string $verdict, ?string $reason): void
    {
        DB::transaction(function () use ($id, $uuid, $actor, $verdict, $reason) {
            $entry = Enrollment::lockForUpdate()->findOrFail($id);
            $this->requireAnalysis($entry);
            $document = $entry->documents()->where('uuid', $uuid)->lockForUpdate()->firstOrFail();
            $reason = trim($reason ?? '');
            if (in_array($verdict, ['rejected', 'correction_requested'], true) && mb_strlen($reason) < 3) {
                throw new InvalidEnrollmentStateException('Indiquez un motif clair pour une pièce refusée ou à corriger.');
            }
            if ($document->review_status === $verdict && ($document->comment ?? '') === $reason) {
                return;
            }
            $previous = $document->review_status;
            $document->fill(['review_status' => $verdict, 'verified' => $verdict === 'accepted', 'verified_by' => $actor, 'verified_at' => now(), 'comment' => $reason ?: null])->save();
            $entry->events()->create(['event' => 'document_reviewed', 'actor_id' => $actor, 'payload' => ['document_uuid' => $uuid, 'document_name' => $document->filename, 'version' => $document->version, 'from' => $previous, 'verdict' => $verdict, 'reason' => $reason ?: null], 'occurred_at' => now()]);
            if (in_array($verdict, ['accepted', 'rejected', 'correction_requested'], true)) {
                $entry->student?->notify(new \App\Notifications\EnrollmentDocumentReviewed([
                    'enrollment_id' => $entry->id, 'reference' => $entry->reference,
                    'document_uuid' => $document->uuid, 'filename' => $document->filename,
                    'version' => $document->version, 'verdict' => $verdict, 'comment' => $reason ?: null,
                ]));
            }
            app(CompleteEnrollmentReview::class)->execute($entry, $actor);
        });
    }

    public function requestCorrections(int $id, int $actor): bool
    {
        return DB::transaction(function () use ($id, $actor) {
            $entry = Enrollment::lockForUpdate()->findOrFail($id);
            $this->requireAnalysis($entry);
            $documents = $entry->documents()->whereIn('review_status', ['rejected', 'correction_requested'])->orderBy('id')->get();
            if ($documents->isEmpty()) {
                throw new InvalidEnrollmentStateException('Sélectionnez au moins une pièce à corriger ou refusée, avec un motif.');
            }
            $signature = hash('sha256', $documents->map(fn ($document) => [$document->uuid, $document->version, $document->review_status, $document->comment])->toJson());
            if (($entry->meta['correction_request_hash'] ?? null) === $signature) {
                return false;
            }
            $entry->meta = array_merge($entry->meta ?? [], ['correction_request_hash' => $signature, 'corrections_requested_at' => now()->toISOString(), 'correction_documents' => $documents->pluck('uuid')->all()]);
            $entry->save();
            $remarks = [];
            foreach ($documents as $index => $document) {
                $remarks['Pièce '.($index + 1).' · '.$document->filename] = $document->comment;
            }
            $entry->events()->create(['event' => 'corrections_requested', 'actor_id' => $actor, 'payload' => ['reason' => 'Des pièces sont à corriger. Consultez les remarques associées à chaque document.'], 'occurred_at' => now()]);
            $this->notifications->afterCommit($id, 'corrections_requested', $remarks);

            return true;
        });
    }
}
