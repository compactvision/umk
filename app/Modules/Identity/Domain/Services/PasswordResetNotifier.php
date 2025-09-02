<?php
namespace App\Modules\Identity\Domain\Services;

use App\Modules\Identity\Domain\Entities\User;

interface PasswordResetNotifier
{
    public function sendResetLink(User $user): void;
}
