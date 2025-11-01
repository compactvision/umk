<?php


namespace App\Modules\Enrollment\Domain\Exceptions;

use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;

class InvalidEnrollmentStateException extends EnrollmentException
{
    public static function cannotTransition(EnrollmentStatus $from, EnrollmentStatus $to): self
    {
        return new self("Impossible de passer de {$from->value} à {$to->value}");
    }

    public static function cannotSubmitDraft(string $reason): self
    {
        return new self("Impossible de soumettre le brouillon: {$reason}");
    }
}
