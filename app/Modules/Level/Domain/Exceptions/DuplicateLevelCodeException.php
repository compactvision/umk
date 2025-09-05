<?php

namespace App\Modules\Level\Domain\Exceptions;

final class DuplicateLevelCodeException extends \DomainException
{
    public function __construct(string $code)
    {
        parent::__construct("Un niveau avec le code '{$code}' existe déjà.");
    }
}
