<?php

namespace App\Modules\Assessment\Application;

use Illuminate\Validation\ValidationException;

final class AssessmentRules
{
    public static function points(mixed $value, string $field, bool $signed = false): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $input = str_replace(',', '.', (string) $value);
        if (! preg_match('/^'.($signed ? '-?' : '').'\d{1,5}(?:\.\d{1,2})?$/D', $input)) {
            throw ValidationException::withMessages([$field => 'Saisissez une valeur avec au plus deux décimales.']);
        }
        [$integer, $decimal] = array_pad(explode('.', ltrim($input, '-'), 2), 2, '0');
        $points = ((int) $integer * 100 + (int) str_pad($decimal, 2, '0')) * (str_starts_with($input, '-') ? -1 : 1);
        if (abs($points) > 1000000) {
            throw ValidationException::withMessages([$field => 'La valeur dépasse la limite de 10 000 points.']);
        }

        return $points;
    }

    public static function revision(int $actual, int|string $expected): void
    {
        if ($actual !== (int) $expected) {
            throw ValidationException::withMessages(['revision' => 'Les données ont changé. Rechargez la page avant de poursuivre.']);
        }
    }

    public static function require(bool $condition, string $field, string $message): void
    {
        if (! $condition) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }
}
