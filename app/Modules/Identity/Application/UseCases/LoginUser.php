<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;

final class LoginUser
{
    public function __construct(private UserRepository $repo) {}

    public function execute(string $email, string $password): ?int
    {
        $user = $this->repo->findByEmail($email);

        if (!$user || !Hash::check($password, $user->password())) {
            return null;
        }

        return $user->id();
    }
}
