<?php

namespace App\Modules\Identity\Domain\Services;

use App\Modules\Identity\Domain\Entities\User;

interface EmailVerificationNotifier
{
    public function sendVerificationLink(User $user): void;
}
