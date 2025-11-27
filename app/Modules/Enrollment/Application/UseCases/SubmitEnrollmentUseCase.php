<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Mail\EnrollmentSubmitted;
use App\Models\Enrollment;
use App\Modules\Enrollment\Application\DTOs\SubmitEnrollmentDTO;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\EnrollmentNotFoundException;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use App\Modules\Enrollment\Domain\Services\EnrollmentValidator;
use App\Modules\Enrollment\Domain\Services\MatriculeGenerator;
use Illuminate\Support\Facades\DB;
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
            // Récupérer le brouillon
            $enrollment = $this->enrollmentRepository->findByUuid($dto->uuid);
            
            if (!$enrollment) {
                throw EnrollmentNotFoundException::withUuid($dto->uuid);
            }
            
            // Vérifier que c'est bien le brouillon de l'étudiant
            if ($enrollment->student_id !== $dto->studentId) {
                throw new InvalidEnrollmentStateException("Vous n'êtes pas autorisé à soumettre cette inscription");
            }
            
            // Vérifier le statut
            if ($enrollment->status === EnrollmentStatus::SUBMITTED) {
                return $enrollment; // Idempotence : déjà soumis, on renvoie tel quel
            }

            if ($enrollment->status !== EnrollmentStatus::DRAFT) {
                throw InvalidEnrollmentStateException::cannotTransition(
                    $enrollment->status,
                    EnrollmentStatus::SUBMITTED
                );
            }
            
            // Valider la complétude
            $this->validator->canSubmit($enrollment);
            
            // Générer le matricule
            if (!$enrollment->matricule && $enrollment->level && $enrollment->academicYear) {
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
            
            // Envoyer l'email de confirmation
            try {
                Mail::to($savedEnrollment->student->email)
                    ->send(new EnrollmentSubmitted($savedEnrollment));
            } catch (\Exception $e) {
                // Log l'erreur mais ne bloque pas le processus
                \Log::error('Failed to send enrollment confirmation email', [
                    'enrollment_id' => $savedEnrollment->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            return $savedEnrollment;
        });
    }
}