<?php
namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Domain\Services\PasswordResetNotifier;

final class RequestPasswordReset
{
    public function __construct(
        private UserRepository $repo,
        private PasswordResetNotifier $notifier
    ) {}

    public function execute(string $email): void
    {
        // Étape 1 : trouver l'utilisateur par email
        $user = $this->repo->findByEmail($email);

        // Étape 2 : si trouvé → envoyer un email de reset
        if ($user) {
            $this->notifier->sendResetLink($user);
        }

        // ⚠️ volontairement pas d’exception si l’email n’existe pas
        // → c’est une bonne pratique de sécurité pour ne pas leak la liste des emails valides
    }
}
