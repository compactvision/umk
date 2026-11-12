<?php

namespace App\Modules\Identity\Infrastructure\Services;

use Laravel\Socialite\Facades\Socialite;

final class SocialiteService
{
    public function redirect(string $provider)
    {
        abort_unless(in_array($provider, ['google', 'facebook'], true), 404);

        return Socialite::driver($provider)->redirect();
    }

    public function user(string $provider): array
    {
        abort_unless(in_array($provider, ['google', 'facebook'], true), 404);
        $socialUser = Socialite::driver($provider)->user();

        return [
            'id' => $socialUser->getId(),
            'last_name' => $socialUser->getName(),
            'first_name' => $socialUser->getEmail(),
            'email' => $socialUser->getEmail(),
            'email_verified' => $provider === 'google' && (($socialUser->user['email_verified'] ?? $socialUser->user['verified_email'] ?? false) === true),
        ];
    }
}
