<?php
namespace App\Modules\Identity\Infrastructure\Notifications;

use App\Modules\Identity\Domain\Entities\User;
use App\Modules\Identity\Domain\Services\EmailVerificationNotifier;
use App\Models\User as EloquentUser;

final class LaravelEmailVerificationNotifier implements EmailVerificationNotifier
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
