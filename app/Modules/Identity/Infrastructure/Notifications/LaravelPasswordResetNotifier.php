<?php
namespace App\Modules\Identity\Infrastructure\Notifications;

use App\Modules\Identity\Domain\Services\PasswordResetNotifier;
use App\Modules\Identity\Domain\Entities\User;
use App\Models\User as EloquentUser;
use Illuminate\Support\Facades\Password;

final class LaravelPasswordResetNotifier implements PasswordResetNotifier
{
    public function sendResetLink(User $user): void
    {
        $eloquent = EloquentUser::find($user->id());

        if ($eloquent) {
            Password::sendResetLink(['email' => $eloquent->email]);
        }
    }
}
