<?php

namespace App\Modules\Identity\Domain\Services;

use App\Modules\Identity\Domain\Entities\User;

interface UserEmailVerificationService
{
    public function sendVerificationLink(User $user): void;
}
