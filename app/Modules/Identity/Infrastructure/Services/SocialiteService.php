<?php
namespace App\Modules\Identity\Infrastructure\Services;

use Laravel\Socialite\Facades\Socialite;

final class SocialiteService
{
    public function redirect(string $provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    public function user(string $provider): array
    {
        $socialUser = Socialite::driver($provider)->user();

        return [
            'id'    => $socialUser->getId(),
            'last_name'  => $socialUser->getName(),
            'first_name' => $socialUser->getEmail(),
            'email' => $socialUser->getEmail(),
        ];
    }
}
