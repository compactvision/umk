<?php


namespace App\Modules\Enrollment\Domain\Exceptions;

class EnrollmentNotFoundException extends EnrollmentException
{
    public static function withId(int $id): self
    {
        return new self("Inscription #{$id} introuvable");
    }

    public static function withUuid(string $uuid): self
    {
        return new self("Inscription avec UUID {$uuid} introuvable");
    }
}
