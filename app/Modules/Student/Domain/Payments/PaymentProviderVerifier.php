<?php

namespace App\Modules\Student\Domain\Payments;

interface PaymentProviderVerifier
{
    /** Must validate the provider signature and reconcile against its server API; never trust client success flags. */
    public function verify(array $serverPayload): VerifiedPayment;
}
