<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\PaymentRefund;
use App\Models\Student\StudentPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class PaymentRefundService
{
    public function __construct(private StudentFinanceService $finance) {}

    public function request(StudentPayment $payment, User $actor, array $data): PaymentRefund
    {
        $this->finance->authorize($payment->enrollment, $actor);

        return DB::transaction(function () use ($payment, $actor, $data) {
            AcademicEnrollment::lockForUpdate()->findOrFail($payment->academic_enrollment_id);
            $payment = StudentPayment::lockForUpdate()->findOrFail($payment->id);
            $amount = Money::cents($data['amount']);
            if ($existing = PaymentRefund::where('operation_key', $data['operation_key'])->first()) {
                if ((int) $existing->student_payment_id !== (int) $payment->id || (int) $existing->amount_cents !== $amount || $existing->reason !== $data['reason']) {
                    throw ValidationException::withMessages(['operation_key' => 'Cette clé désigne une autre demande.']);
                }

                return $existing;
            }
            $reserved = (int) $payment->refunds()->whereIn('status', ['requested', 'approved', 'executed'])->sum('amount_cents');
            if ($payment->status !== 'confirmed' || $amount <= 0 || $amount > (int) $payment->amount_cents - $reserved) {
                throw ValidationException::withMessages(['amount' => 'Le remboursement dépasse le montant encore remboursable ou réservé.']);
            }
            $refund = $payment->refunds()->create(['uuid' => (string) Str::uuid(), 'operation_key' => $data['operation_key'], 'amount_cents' => $amount, 'reason' => $data['reason'], 'requested_by' => $actor->id]);
            Audit::record($actor->id, 'refund_requested', $refund, $data['reason']);

            return $refund;
        }, 3);
    }

    public function transition(PaymentRefund $refund, User $actor, array $data): void
    {
        $this->finance->authorize($refund->payment->enrollment, $actor);
        FinanceMutation::run(fn () => DB::transaction(function () use ($refund, $actor, $data) {
            AcademicEnrollment::lockForUpdate()->findOrFail($refund->payment->academic_enrollment_id);
            $payment = StudentPayment::with(['allocations.reversals', 'refunds'])->lockForUpdate()->findOrFail($refund->student_payment_id);
            $refund = PaymentRefund::lockForUpdate()->findOrFail($refund->id);
            $next = $data['status'];
            $from = $refund->status;
            if ($refund->status === $next) {
                if ($next === 'executed' && ($refund->execution_reference !== ($data['execution_reference'] ?? null) || $refund->method !== ($data['method'] ?? null))) {
                    throw ValidationException::withMessages(['execution_reference' => 'Le décaissement est déjà enregistré avec une autre référence.']);
                }

                return;
            }
            if ($next === 'approved' && $refund->status === 'requested') {
                if (config('finance.dual_control') && (int) $refund->requested_by === (int) $actor->id) {
                    throw ValidationException::withMessages(['refund' => 'Un autre agent doit autoriser ce remboursement.']);
                }
                $refund->update(['status' => 'approved', 'approved_by' => $actor->id, 'approved_at' => now()]);
            } elseif ($next === 'cancelled' && in_array($refund->status, ['requested', 'approved'], true)) {
                $refund->update(['status' => 'cancelled']);
            } elseif ($next === 'executed' && $refund->status === 'approved') {
                if ($payment->status !== 'confirmed' || ! in_array($data['method'] ?? '', config('finance.methods'), true) || empty($data['execution_reference'])) {
                    throw ValidationException::withMessages(['refund' => 'Confirmez le décaissement avec une méthode et une référence réelles.']);
                }
                if (PaymentRefund::where('execution_reference', $data['execution_reference'])->exists()) {
                    throw ValidationException::withMessages(['execution_reference' => 'Cette référence de décaissement existe déjà.']);
                }
                $previous = (int) $payment->refunds->where('status', 'executed')->sum('amount_cents');
                if ($previous + (int) $refund->amount_cents > (int) $payment->amount_cents) {
                    throw ValidationException::withMessages(['refund' => 'Le plafond remboursable est dépassé.']);
                }
                $allocated = (int) $payment->allocations->sum(fn ($a) => (int) $a->amount_cents - (int) $a->reversals->sum('amount_cents'));
                $unallocated = $payment->kind === 'unallocated' ? max(0, (int) $payment->amount_cents - $previous - $allocated) : 0;
                $reverse = max(0, (int) $refund->amount_cents - $unallocated);
                foreach ($payment->allocations->sortByDesc('id') as $allocation) {
                    $amount = min($reverse, (int) $allocation->amount_cents - (int) $allocation->reversals->sum('amount_cents'));
                    if ($amount > 0) {
                        $refund->allocations()->create(['student_payment_allocation_id' => $allocation->id, 'amount_cents' => $amount]);
                    }
                    $reverse -= $amount;
                }
                $refund->update(['status' => 'executed', 'executed_by' => $actor->id, 'executed_at' => now(), 'method' => $data['method'], 'execution_reference' => $data['execution_reference']]);
                if ($previous + (int) $refund->amount_cents === (int) $payment->amount_cents) {
                    FinanceMutation::run(fn () => $payment->update(['status' => 'refunded']));
                }
            } else {
                throw ValidationException::withMessages(['refund' => 'Cette transition de remboursement est interdite.']);
            }
            if ($next === 'executed') {
                $this->finance->notifyPayment($payment, $payment->enrollment, 'refund_executed');
            }
            Audit::record($actor->id, 'refund_'.$next, $refund, $data['reason'], ['from' => $from, 'to' => $next, 'payment_id' => $payment->id, 'amount_cents' => (int) $refund->amount_cents]);
        }, 3));
    }
}
