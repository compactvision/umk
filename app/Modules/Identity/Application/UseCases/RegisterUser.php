<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Entities\User;
use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Services\EmailVerificationNotifier;

final class RegisterUser
{
    public function __construct(private UserRepository $repo, private EmailVerificationNotifier $notifier) {}

    public function execute(string $lastName, string $firstName, string $postName, string $gender, string $email, string $password): User
    {
        $hashed = bcrypt($password);

        $user = User::register($lastName, $firstName, $postName, $gender, $email, $hashed);

        $saved = $this->repo->save($user);

        $this->notifier->sendVerificationLink($saved);

        return $saved;
    }
}
