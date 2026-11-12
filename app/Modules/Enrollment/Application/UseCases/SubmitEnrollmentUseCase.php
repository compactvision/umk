<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Mail\EnrollmentSubmitted;
use App\Models\Enrollment;
use App\Models\User;
use App\Modules\Enrollment\Application\DTOs\SubmitEnrollmentDTO;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\DraftExpiredException;
use App\Modules\Enrollment\Domain\Exceptions\EnrollmentNotFoundException;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use App\Modules\Enrollment\Domain\Services\EnrollmentValidator;
use App\Modules\Enrollment\Domain\Services\MatriculeGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubmitEnrollmentUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $enrollmentRepository,
        private readonly DocumentRepositoryInterface $documentRepository,
        private readonly EnrollmentValidator $validator,
        private readonly MatriculeGenerator $matriculeGenerator,
    ) {}

    public function execute(SubmitEnrollmentDTO $dto): Enrollment
    {
        return DB::transaction(function () use ($dto) {
            User::whereKey($dto->studentId)->lockForUpdate()->firstOrFail();

            // Récupérer le brouillon
            $enrollment = Enrollment::where('uuid', $dto->uuid)->lockForUpdate()->first();

            if (! $enrollment) {
                throw EnrollmentNotFoundException::withUuid($dto->uuid);
            }

            // Vérifier que c'est bien le brouillon de l'étudiant
            if ($enrollment->student_id !== $dto->studentId) {
                throw new InvalidEnrollmentStateException("Vous n'êtes pas autorisé à soumettre cette inscription");
            }

            // Vérifier le statut
            if ($enrollment->status === EnrollmentStatus::SUBMITTED
                || (isset($enrollment->meta['submitted_at']) && in_array($enrollment->status, [EnrollmentStatus::PENDING, EnrollmentStatus::VALIDATED, EnrollmentStatus::REJECTED], true))) {
                return $enrollment; // Idempotence : déjà soumis, on renvoie tel quel
            }

            if ($enrollment->status !== EnrollmentStatus::DRAFT) {
                throw InvalidEnrollmentStateException::cannotTransition(
                    $enrollment->status,
                    EnrollmentStatus::SUBMITTED
                );
            }

            if ($enrollment->isExpired()) {
                throw DraftExpiredException::forUuid($dto->uuid);
            }
            if ($this->enrollmentRepository->checkUniqueness($dto->studentId, (int) $enrollment->level_id, (int) $enrollment->academic_year_id, $enrollment->id)) {
                throw new InvalidEnrollmentStateException('Une candidature existe déjà pour ce niveau et cette année.');
            }

            // Valider la complétude
            $context = $this->validator->canSubmit($enrollment);

            $programId = $context['program'];
            if ($programId !== null) {
                $enrollment->form_snapshot = array_merge($enrollment->form_snapshot, ['academic_program_id' => $programId]);
            }
            $enrollment->meta = array_merge($enrollment->meta ?? [], [
                'submitted_at' => now()->toISOString(),
                'required_documents' => $context['documents'],
            ]);

            // Générer le matricule
            if (! $enrollment->matricule && $enrollment->level && $enrollment->academicYear) {
                $matricule = $this->matriculeGenerator->generate(
                    $enrollment->level,
                    $enrollment->academicYear
                );
                $enrollment->matricule = $matricule->toString();
            }

            // Changer le statut
            $enrollment->status = EnrollmentStatus::SUBMITTED;
            $enrollment->notes = $dto->notes;
            $enrollment->draft_expires_at = null;

            // Marquer les documents comme permanents
            $this->documentRepository->markAsPermanent($enrollment->id);

            $savedEnrollment = $this->enrollmentRepository->save($enrollment);

            $savedEnrollment->events()->create([
                'event' => 'submitted', 'actor_id' => $dto->studentId,
                'payload' => ['from' => 'draft'], 'occurred_at' => now(),
            ]);

            // Send only after the persisted submission has committed.
            DB::afterCommit(function () use ($savedEnrollment) {
                try {
                    Mail::to($savedEnrollment->student->email)->send(new EnrollmentSubmitted($savedEnrollment));
                    $event = 'email_sent';
                } catch (\Throwable $exception) {
                    $event = 'email_failed';
                    Log::error('Failed to send enrollment confirmation email', [
                        'enrollment_id' => $savedEnrollment->id,
                    ]);
                }
                try {
                    $savedEnrollment->events()->create([
                        'event' => $event, 'payload' => ['notification' => 'submitted'], 'occurred_at' => now(),
                    ]);
                } catch (\Throwable) {
                    Log::warning('Résultat du reçu d’admission non journalisé', ['enrollment_id' => $savedEnrollment->id, 'outcome' => $event]);
                }
            });

            return $savedEnrollment;
        });
    }
}
