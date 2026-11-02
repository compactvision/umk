<?php

namespace App\Modules\Student\Domain\Payments;

final readonly class VerifiedPayment
{
    public function __construct(public string $reference, public int $amountCents, public string $currency) {}
}
