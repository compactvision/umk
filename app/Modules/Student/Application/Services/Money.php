<?php

namespace App\Modules\Student\Application\Services;

use Illuminate\Validation\ValidationException;

final class Money
{
    public static function cents(string|int|float $amount): int
    {
        $value = (string) $amount;
        if (! preg_match('/^\d{1,9}(\.\d{1,2})?$/D', $value)) {
            throw ValidationException::withMessages(['amount' => 'Indiquez un montant positif avec deux décimales au maximum.']);
        }
        [$whole,$decimal] = array_pad(explode('.', $value), 2, '');

        return (int) $whole * 100 + (int) str_pad($decimal, 2, '0');
    }
}
