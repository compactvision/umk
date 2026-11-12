<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Exceptions\InvalidCredentialsException;
use App\Modules\Identity\Domain\Exceptions\UserNotFoundException;
use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Services\LoginRateLimiter;
use App\Modules\Identity\Domain\Services\PasswordHasher;

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
        if (! $user) {
            $this->hasher->verify($password, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
            $this->limiter->hit($email);
            throw new UserNotFoundException('Utilisateur introuvable');
        }

        if (! $this->hasher->verify($password, $user->passwordHash())) {
            $this->limiter->hit($email);
            throw new InvalidCredentialsException('Identifiants invalides');
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
