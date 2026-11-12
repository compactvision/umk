<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentPayment;
use App\Modules\Student\Domain\Payments\PaymentProviderVerifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ProviderPaymentReconciliation
{
    public function __construct(private StudentFinanceService $finance) {}

    /** No public webhook is exposed until an institution-approved verifier is configured. */
    public function reconcile(array $serverPayload): StudentPayment
    {
        $class = config('student.payment_verifier');
        if (! $class || ! is_a($class, PaymentProviderVerifier::class, true)) {
            throw new \LogicException('Aucun prestataire de paiement vérifié n’est configuré.');
        }
        $verified = app($class)->verify($serverPayload);

        return DB::transaction(function () use ($verified, $class) {
            $candidate = StudentPayment::where('reference', $verified->reference)->firstOrFail();
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($candidate->academic_enrollment_id);
            $payment = StudentPayment::lockForUpdate()->findOrFail($candidate->id);
            if ($verified->amountCents <= 0 || (int) $payment->amount_cents !== $verified->amountCents || $payment->currency !== $verified->currency) {
                throw ValidationException::withMessages(['payment' => 'Le montant ou la devise ne correspond pas à l’écriture attendue.']);
            }
            if ($payment->status === 'confirmed') {
                return $payment;
            }
            if ($payment->status !== 'pending') {
                throw ValidationException::withMessages(['payment' => 'Cette écriture ne peut plus être confirmée.']);
            }
            FinanceMutation::run(fn () => $payment->update(['status' => 'confirmed', 'confirmed_at' => now(), 'confirmed_by' => null]));
            app(FinanceReceiptService::class)->capture($payment, $entry);
            $this->finance->notifyPayment($payment, $entry);
            Audit::record(null, 'payment_confirmed', $payment, 'Confirmation serveur du prestataire vérifié.', ['source' => $class]);
            if ($payment->kind === 'tuition') {
                $this->finance->confirmPendingEnrollment($entry);
            }

            return $payment;
        });
    }
}
