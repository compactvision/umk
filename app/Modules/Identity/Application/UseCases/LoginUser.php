<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Services\PasswordHasher;
use App\Modules\Identity\Domain\Services\LoginRateLimiter;
use App\Modules\Identity\Domain\Exceptions\UserNotFoundException;
use App\Modules\Identity\Domain\Exceptions\InvalidCredentialsException;

final class LoginUser
{
    public function __construct(
        private UserRepository $repo,
        private PasswordHasher $hasher,
        private LoginRateLimiter $limiter
    ) {}

    public function execute(string $email, string $password): int
{
    // 🔎 Vérifie si bloqué
    $this->limiter->ensureIsNotLimited($email);

    $user = $this->repo->findByEmail($email);
    if (!$user) {
        $this->limiter->hit($email);
        throw new UserNotFoundException("Utilisateur introuvable");
    }

    if (!$this->hasher->verify($password, $user->passwordHash())) {
        $this->limiter->hit($email);
        throw new InvalidCredentialsException("Identifiants invalides");
    }

    if ($user->role() === null) {
        $user->assignRole('user');
        $this->repo->save($user);
    }

    // ✅ Succès → reset
    $this->limiter->clear($email);

    return $user->id();
}

}
