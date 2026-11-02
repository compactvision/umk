<?php

namespace App\Support;

final class DocumentUploadLimit
{
    public static function kilobytes(): int
    {
        $limits = [10240];
        foreach (['upload_max_filesize', 'post_max_size'] as $setting) {
            $bytes = ini_parse_quantity(ini_get($setting));
            if ($bytes > 0) {
                $limits[] = max(1, (int) floor(($bytes - ($setting === 'post_max_size' ? 524288 : 0)) / 1024));
            }
        }

        return min($limits);
    }
}
