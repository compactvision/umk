<?php

namespace App\Support;

use Illuminate\Encryption\Encrypter;

final class ApplicationKey
{
    public static function error(): ?string
    {
        $keys = [config('app.key'), ...config('app.previous_keys', [])];
        foreach ($keys as $index => $key) {
            $label = $index === 0 ? 'APP_KEY' : 'APP_PREVIOUS_KEYS';
            if (! is_string($key) || trim($key) === '') {
                return $label.' absente.';
            }
            $decoded = str_starts_with($key, 'base64:') ? base64_decode(substr($key, 7), true) : $key;
            if ($decoded === false || ! Encrypter::supported($decoded, config('app.cipher'))) {
                return $label.' invalide pour le chiffrement configuré.';
            }
        }

        return null;
    }
}
