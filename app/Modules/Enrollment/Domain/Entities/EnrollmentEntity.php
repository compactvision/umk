<?php
// app/Modules/Enrollment/Domain/Entities/EnrollmentEntity.php

namespace App\Modules\Enrollment\Domain\Entities;

use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Enums\PaymentStatus;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Enrollment\Domain\ValueObjects\EnrollmentId;
use App\Modules\Enrollment\Domain\ValueObjects\Matricule;
use DateTimeImmutable;

/**
 * Entité métier Enrollment
 * Contient uniquement la logique métier pure, sans dépendance à Eloquent
 */
final class EnrollmentEntity
{
    private function __construct(
        private ?EnrollmentId $id,
        private int $studentId,
        private ?int $levelId,
        private ?int $academicYearId,
        private EnrollmentStatus $status,
        private PaymentStatus $paymentStatus,
        private ?Matricule $matricule,
        private ?DateTimeImmutable $enrolledAt,
        private ?string $notes,
        private array $meta,
        private int $lastStep,
        private array $formSnapshot,
        private ?DateTimeImmutable $draftExpiresAt
    ) {}

    public static function create(
        int $studentId,
        ?int $levelId = null,
        ?int $academicYearId = null
    ): self {
        return new self(
            id: null,
            studentId: $studentId,
            levelId: $levelId,
            academicYearId: $academicYearId,
            status: EnrollmentStatus::DRAFT,
            paymentStatus: PaymentStatus::UNPAID,
            matricule: null,
            enrolledAt: null,
            notes: null,
            meta: [],
            lastStep: 1,
            formSnapshot: [],
            draftExpiresAt: (new DateTimeImmutable())->modify('+30 days')
        );
    }

    public function submit(Matricule $matricule): void
    {
        if (!$this->status->canTransitionTo(EnrollmentStatus::PENDING)) {
            throw InvalidEnrollmentStateException::cannotTransition(
                $this->status,
                EnrollmentStatus::PENDING
            );
        }

        $this->status = EnrollmentStatus::PENDING;
        $this->matricule = $matricule;
        $this->draftExpiresAt = null;
    }

    public function validate(DateTimeImmutable $enrolledAt): void
    {
        if (!$this->status->canTransitionTo(EnrollmentStatus::VALIDATED)) {
            throw InvalidEnrollmentStateException::cannotTransition(
                $this->status,
                EnrollmentStatus::VALIDATED
            );
        }

        $this->status = EnrollmentStatus::VALIDATED;
        $this->enrolledAt = $enrolledAt;
    }

    public function reject(string $reason): void
    {
        if (!$this->status->canTransitionTo(EnrollmentStatus::REJECTED)) {
            throw InvalidEnrollmentStateException::cannotTransition(
                $this->status,
                EnrollmentStatus::REJECTED
            );
        }

        $this->status = EnrollmentStatus::REJECTED;
        $this->notes = $reason;
    }

    public function cancel(): void
    {
        if (!$this->status->canTransitionTo(EnrollmentStatus::CANCELLED)) {
            throw InvalidEnrollmentStateException::cannotTransition(
                $this->status,
                EnrollmentStatus::CANCELLED
            );
        }

        $this->status = EnrollmentStatus::CANCELLED;
    }

    public function updateProgress(int $step, array $snapshot): void
    {
        if ($step > $this->lastStep) {
            $this->lastStep = $step;
        }

        $this->formSnapshot = array_merge($this->formSnapshot, $snapshot);
        
        // Étendre l'expiration du brouillon
        if ($this->status === EnrollmentStatus::DRAFT) {
            $this->draftExpiresAt = (new DateTimeImmutable())->modify('+30 days');
        }
    }

    public function markAsPaid(): void
    {
        $this->paymentStatus = PaymentStatus::PAID;
    }

    public function markAsPartiallyPaid(): void
    {
        $this->paymentStatus = PaymentStatus::PARTIAL;
    }

    public function isExpired(): bool
    {
        if ($this->status !== EnrollmentStatus::DRAFT || !$this->draftExpiresAt) {
            return false;
        }

        return $this->draftExpiresAt < new DateTimeImmutable();
    }

    // Getters
    public function getId(): ?EnrollmentId
    {
        return $this->id;
    }

    public function getStudentId(): int
    {
        return $this->studentId;
    }

    public function getLevelId(): ?int
    {
        return $this->levelId;
    }

    public function getAcademicYearId(): ?int
    {
        return $this->academicYearId;
    }

    public function getStatus(): EnrollmentStatus
    {
        return $this->status;
    }

    public function getPaymentStatus(): PaymentStatus
    {
        return $this->paymentStatus;
    }

    public function getMatricule(): ?Matricule
    {
        return $this->matricule;
    }

    public function getEnrolledAt(): ?DateTimeImmutable
    {
        return $this->enrolledAt;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function getMeta(): array
    {
        return $this->meta;
    }

    public function getLastStep(): int
    {
        return $this->lastStep;
    }

    public function getFormSnapshot(): array
    {
        return $this->formSnapshot;
    }

    public function getDraftExpiresAt(): ?DateTimeImmutable
    {
        return $this->draftExpiresAt;
    }
}