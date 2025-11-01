<?php

namespace App\Modules\Enrollment\Domain\Exceptions;

class DocumentException extends EnrollmentException
{
    public static function invalidFile(string $reason): self
    {
        return new self("Fichier invalide: {$reason}");
    }

    public static function uploadFailed(string $reason): self
    {
        return new self("Échec de l'upload: {$reason}");
    }

    public static function notFound(string $uuid): self
    {
        return new self("Document {$uuid} introuvable");
    }
}
