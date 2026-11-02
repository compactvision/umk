<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use Illuminate\Support\Facades\DB;

final class RecordEnrollmentDecision
{
    public function execute(int $id, int $actorId, EnrollmentStatus $decision, ?string $reason = null): Enrollment
    {
        return DB::transaction(function () use ($id, $actorId, $decision, $reason) {
            $enrollment = Enrollment::lockForUpdate()->findOrFail($id);
            if (! in_array($decision, [EnrollmentStatus::VALIDATED, EnrollmentStatus::REJECTED], true)
                || ! $enrollment->status->canTransitionTo($decision)) {
                throw InvalidEnrollmentStateException::cannotTransition($enrollment->status, $decision);
            }
            $reason = trim($reason ?? '');
            if ($decision === EnrollmentStatus::REJECTED && $reason === '') {
                throw new InvalidEnrollmentStateException('Indiquez le motif du rejet.');
            }
            if ($decision === EnrollmentStatus::VALIDATED && $enrollment->documents()->where('review_status', '!=', 'accepted')->exists()) {
                throw new InvalidEnrollmentStateException('Toutes les pièces jointes doivent être acceptées avant de valider ce dossier.');
            }
            if ($decision === EnrollmentStatus::VALIDATED) {
                app(\App\Modules\Student\Application\Services\StudentAdmissionService::class)->ensureComplete($enrollment);
            }
            $previous = $enrollment->status->value;
            $enrollment->status = $decision;
            $key = $decision === EnrollmentStatus::VALIDATED ? 'validated' : 'rejected';
            $meta = $enrollment->meta ?? [];
            $meta[$key.'_by'] = $actorId;
            $meta[$key.'_at'] = now()->toISOString();
            if ($decision === EnrollmentStatus::VALIDATED) {
                $enrollment->enrolled_at = now();
            } else {
                $meta['rejection_reason'] = $reason;
                $enrollment->notes = $reason;
            }
            $enrollment->meta = $meta;
            $enrollment->save();
            $enrollment->events()->create([
                'event' => $decision->value, 'actor_id' => $actorId,
                'payload' => ['from' => $previous, 'reason' => $reason ?: null],
                'occurred_at' => now(),
            ]);
            if ($decision === EnrollmentStatus::VALIDATED) {
                app(\App\Modules\Student\Application\Services\StudentAdmissionService::class)->activate($enrollment, $actorId);
            }
            app(NotifyEnrollmentReview::class)->afterCommit($id, $decision->value, $reason ? ['Motif de la décision' => $reason] : []);

            return $enrollment;
        });
    }
}
