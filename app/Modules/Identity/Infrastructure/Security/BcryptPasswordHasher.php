<?php

namespace App\Modules\Identity\Infrastructure\Security;

use App\Modules\Identity\Domain\Services\PasswordHasher;
use Illuminate\Support\Facades\Hash;

final class BcryptPasswordHasher implements PasswordHasher
{
    public function hash(string $plain): string
    {
        return Hash::make($plain);
    }

    public function verify(string $plain, string $hash): bool
    {
        return Hash::check($plain, $hash);
    }
}
