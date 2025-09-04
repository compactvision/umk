<?php

namespace App\Modules\Faculty\Domain\Exceptions;

use DomainException;

final class DuplicateFacultyException extends DomainException
{
    public function __construct(string $field, string $value)
    {
        parent::__construct("Une faculté avec $field '$value' existe déjà.");
    }
}
