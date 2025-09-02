<?php
namespace App\Modules\Identity\Infrastructure\Notifications;

use App\Modules\Identity\Domain\Entities\User;
use App\Modules\Identity\Domain\Services\UserEmailVerificationService;
use App\Models\User as EloquentUser;

final class LaravelEmailVerificationNotifier implements UserEmailVerificationService
{
    public function sendVerificationLink(User $user): void
    {
        $model = EloquentUser::find($user->id());

        if (!$model) {
            throw new \DomainException("Utilisateur introuvable");
        }

        $model->sendEmailVerificationNotification();
    }
}
