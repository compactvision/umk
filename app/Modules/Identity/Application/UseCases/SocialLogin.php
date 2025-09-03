<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Entities\User;

final class SocialLogin
{
    public function __construct(private UserRepository $repo) {}

    public function execute(string $provider, array $socialUser): User
    {
        $existing = $this->repo->findByEmail($socialUser['email']);

        if ($existing) {
            return $existing;
        }

        $user = User::registerFromSocial(
            $provider,
            $socialUser['id'],
            $socialUser['last_name'],
            $socialUser['first_name'],
            $socialUser['email']
        );

        return $this->repo->save($user);
    }
}
