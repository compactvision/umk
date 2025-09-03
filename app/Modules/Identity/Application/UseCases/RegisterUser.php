<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Entities\User;
use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Services\PasswordHasher;
use App\Modules\Identity\Domain\Services\UserEmailVerificationService;

final class RegisterUser
{
    public function __construct(
        private UserRepository $repo,
        private PasswordHasher $hasher,
        private UserEmailVerificationService $notifier
    ) {}

    public function execute(
        string $lastName,
        string $firstName,
        ?string $postName,
        ?string $gender,
        string $email,
        string $password
    ): User {
        $hash = $this->hasher->hash($password);
        $user = User::register($lastName, $firstName, $postName, $gender, $email, $hash);
        $user->assignRole('user');
        $saved = $this->repo->save($user);

        $this->notifier->sendVerificationLink($saved);

        return $saved;
    }
}
