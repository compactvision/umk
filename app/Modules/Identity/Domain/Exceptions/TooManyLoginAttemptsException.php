<?php
namespace App\Modules\Identity\Domain\Exceptions;

use DomainException;

final class TooManyLoginAttemptsException extends DomainException
{
    public function __construct(string $message = "Trop de tentatives, veuillez réessayer plus tard.")
    {
        parent::__construct($message);
    }
}
