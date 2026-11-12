<?php

namespace App\Modules\Student\Domain\Payments;

interface PaymentGateway extends PaymentProviderVerifier
{
    /** Adapter-selected endpoint only; never treat a browser return as settlement. */
    public function initiate(PaymentIntent $intent): PaymentInitiation;

    /** Resolve ambiguous timeouts and delayed callbacks through a server API. */
    public function lookup(string $internalReference): ?VerifiedPayment;
}
