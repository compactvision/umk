<?php

namespace App\Modules\Enrollment\Domain\Exceptions;

use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;

class InvalidEnrollmentStateException extends EnrollmentException
{
    public static function cannotTransition(EnrollmentStatus $from, EnrollmentStatus $to): self
    {
        return new self(
            "Impossible de passer du statut '{$from->label()}' au statut '{$to->label()}'"
        );
    }

    public function __construct(string $message = "État d'inscription invalide")
    {
        parent::__construct($message);
    }
}
