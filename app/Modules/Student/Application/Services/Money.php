<?php

namespace App\Modules\Student\Application\Services;

use Illuminate\Validation\ValidationException;

final class Money
{
    public static function cents(mixed $amount): int
    {
        if (! is_string($amount) && ! is_int($amount)) {
            throw ValidationException::withMessages(['amount' => 'Transmettez les montants sous forme de chaîne décimale, sans flottant binaire.']);
        }
        $value = (string) $amount;
        if (! preg_match('/^\d{1,9}(\.\d{1,2})?$/D', $value)) {
            throw ValidationException::withMessages(['amount' => 'Indiquez un montant positif avec deux décimales au maximum.']);
        }
        [$whole,$decimal] = array_pad(explode('.', $value), 2, '');

        return (int) $whole * 100 + (int) str_pad($decimal, 2, '0');
    }

    public static function decimal(int $cents): string
    {
        return ($cents < 0 ? '-' : '').intdiv(abs($cents), 100).'.'.str_pad((string) (abs($cents) % 100), 2, '0', STR_PAD_LEFT);
    }
}
