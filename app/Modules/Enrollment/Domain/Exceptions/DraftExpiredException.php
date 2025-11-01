<?php

namespace App\Modules\Enrollment\Domain\Exceptions;

class DraftExpiredException extends EnrollmentException
{
    public static function forUuid(string $uuid): self
    {
        return new self("Le brouillon {$uuid} a expiré");
    }
}