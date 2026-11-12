<?php

namespace App\Modules\Student\Application\Services;

final class FinanceMutation
{
    private static int $depth = 0;

    public static function allowed(): bool
    {
        return self::$depth > 0;
    }

    public static function run(callable $operation): mixed
    {
        self::$depth++;
        try {
            return $operation();
        } finally {
            self::$depth--;
        }
    }
}
