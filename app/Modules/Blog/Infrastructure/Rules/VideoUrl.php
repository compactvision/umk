<?php

namespace App\Modules\Blog\Infrastructure\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VideoUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $url = parse_url((string) $value);
        $host = strtolower($url['host'] ?? '');
        $path = $url['path'] ?? '';
        $supported = preg_match('/\.(mp4|webm)$/i', $path)
            || (in_array($host, ['youtube.com', 'www.youtube.com', 'm.youtube.com'], true)
                && (preg_match('#^/(embed|shorts)/[a-zA-Z0-9_-]{11}/?$#', $path)
                    || ($path === '/watch' && preg_match('/(?:^|&)v=[a-zA-Z0-9_-]{11}(?:&|$)/', $url['query'] ?? ''))))
            || ($host === 'youtu.be' && preg_match('#^/[a-zA-Z0-9_-]{11}/?$#', $path))
            || (in_array($host, ['vimeo.com', 'www.vimeo.com'], true) && preg_match('#^/\d+/?$#', $path));
        if (($url['scheme'] ?? '') !== 'https' || ! $supported || isset($url['user']) || isset($url['pass'])) {
            $fail('Utilisez un lien HTTPS YouTube, Vimeo ou un fichier MP4/WebM.');
        }
    }
}
