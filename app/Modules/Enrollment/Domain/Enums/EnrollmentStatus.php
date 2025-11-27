<?php

namespace App\Modules\Enrollment\Domain\Enums;

enum EnrollmentStatus: string
{
    case DRAFT = 'draft';
    case PENDING = 'pending';
    case VALIDATED = 'validated';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';
    case SUBMITTED = 'submitted';

    public function label(): string
    {
        return match($this) {
            self::DRAFT => 'Brouillon',
            self::PENDING => 'En attente',
            self::VALIDATED => 'Validée',
            self::REJECTED => 'Rejetée',
            self::CANCELLED => 'Annulée',
            self::SUBMITTED => 'Soumise',
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return match($this) {
            self::DRAFT => in_array($newStatus, [self::PENDING, self::SUBMITTED, self::CANCELLED]),
            self::PENDING => in_array($newStatus, [self::VALIDATED, self::REJECTED, self::CANCELLED]),
            self::SUBMITTED => in_array($newStatus, [self::VALIDATED, self::REJECTED, self::CANCELLED]),
            self::VALIDATED => $newStatus === self::CANCELLED,
            self::REJECTED => $newStatus === self::CANCELLED,
            self::CANCELLED => $newStatus === self::CANCELLED,
            default => false,
        };
    }

    public function isDraft(): bool
    {
        return $this === self::DRAFT;
    }

    public function isSubmitted(): bool
    {
        return $this === self::SUBMITTED;
    }

    public function isPending(): bool
    {
        return $this === self::PENDING;
    }

    public function isValidated(): bool
    {
        return $this === self::VALIDATED;
    }

    public function isRejected(): bool
    {
        return $this === self::REJECTED;
    }

    public function isCancelled(): bool
    {
        return $this === self::CANCELLED;
    }
}