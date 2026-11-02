<?php

namespace App\Modules\Blog\Infrastructure\Rules;

final class VideoUploadLimit
{
    public static function kilobytes(): int
    {
        $limits = [102400];
        foreach (['upload_max_filesize', 'post_max_size'] as $setting) {
            $bytes = ini_parse_quantity(ini_get($setting));
            if ($bytes > 0) {
                // Leave room for the rest of a multipart publication.
                $limits[] = max(1, (int) floor(($bytes - ($setting === 'post_max_size' ? 524288 : 0)) / 1024));
            }
        }

        return min($limits);
    }
}
