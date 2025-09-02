<?php

namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Services\EmailVerificationNotifier;

final class SendVerificationEmail
{
    public function __construct(
        private UserRepository $repo,
        private EmailVerificationNotifier $notifier
    ) {}

    public function execute(int $userId): void
    {
        $user = $this->repo->findById($userId);

        if (!$user) {
            throw new \DomainException("Utilisateur introuvable");
        }

        $this->notifier->sendVerificationLink($user);
    }
}
