<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Services\PasswordHasher;
use App\Modules\Identity\Domain\Exceptions\UserNotFoundException;
use App\Modules\Identity\Domain\Exceptions\InvalidCredentialsException;

final class LoginUser
{
    public function __construct(private UserRepository $repo, private PasswordHasher $hasher) {}

    public function execute(string $email, string $password): int
    {
        $user = $this->repo->findByEmail($email);

        if (!$user) {
            throw new UserNotFoundException("Utilisateur introuvable");
        }

        if (!$this->hasher->verify($password, $user->passwordHash())) {
            throw new InvalidCredentialsException("Mot de passe incorrecte");
        }

        return $user->id();
    }
}
