<?php

namespace App\Modules\Identity\Domain\Exceptions;

use DomainException;

class InvalidCredentialsException extends DomainException {
    public function __construct(string $message = "Identifiants invalides")
    {
        parent::__construct($message);
    }
}
class UserNotFoundException extends DomainException {
    public function __construct(string $message = "Utilisateur introuvable")
    {
        parent::__construct($message);
    }
}
