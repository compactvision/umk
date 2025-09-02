<?php
namespace App\Modules\Identity\Domain\Exceptions;

use DomainException;

final class InvalidCredentialsException extends DomainException
{
    public function __construct(string $message = "Mot de passe incorrecte")
    {
        parent::__construct($message);
    }
}
