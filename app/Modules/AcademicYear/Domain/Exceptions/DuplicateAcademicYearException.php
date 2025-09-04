<?php

namespace App\Modules\AcademicYear\Domain\Exceptions;

use DomainException;

class DuplicateAcademicYearException extends DomainException
{
    public function __construct(string $title)
    {
        parent::__construct("L'année académique '{$title}' existe déjà.");
    }
}
