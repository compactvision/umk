<?php

namespace App\Modules\Student\Domain\Payments;

final readonly class PaymentInitiation
{
    public function __construct(public string $providerReference, public string $redirectUrl) {}
}
