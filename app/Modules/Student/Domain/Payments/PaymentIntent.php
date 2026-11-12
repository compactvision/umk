<?php

namespace App\Modules\Student\Domain\Payments;

final readonly class PaymentIntent
{
    public function __construct(public string $internalReference, public int $amountCents, public string $currency, public string $returnUrl, public \DateTimeImmutable $expiresAt) {}
}
