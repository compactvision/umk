<?php
namespace App\Modules\Identity\Domain\Exceptions;

use DomainException;

final class UserNotFoundException extends DomainException
{
    public function __construct(string $message = "Utilisateur introuvable")
    {
        parent::__construct($message);
    }
}
