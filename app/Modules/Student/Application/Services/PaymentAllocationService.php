<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PaymentAllocationService
{
    public function __construct(private StudentFinanceService $finance) {}

    public function allocate(StudentPayment $payment, User $actor, array $rows, string $reason): void
    {
        $this->finance->authorize($payment->enrollment, $actor);
        validator(['allocations' => $rows], ['allocations' => 'required|array|min:1|max:24', 'allocations.*.obligation_id' => 'required|integer|distinct', 'allocations.*.amount' => 'required'])->validate();
        DB::transaction(function () use ($payment, $actor, $rows, $reason) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($payment->academic_enrollment_id);
            $payment = StudentPayment::with(['allocations.reversals', 'refunds'])->lockForUpdate()->findOrFail($payment->id);
            if ($payment->status !== 'confirmed' || $payment->kind !== 'unallocated') {
                throw ValidationException::withMessages(['payment' => 'Seul un encaissement confirmé non affecté peut recevoir ces affectations explicites.']);
            }
            if ($payment->refunds->whereIn('status', ['requested', 'approved'])->isNotEmpty()) {
                throw ValidationException::withMessages(['payment' => 'Traitez le remboursement en cours avant une nouvelle affectation.']);
            }
            $available = (int) $payment->amount_cents - (int) $payment->refunds->where('status', 'executed')->sum('amount_cents') - (int) $payment->allocations->sum(fn ($a) => (int) $a->amount_cents - (int) $a->reversals->sum('amount_cents'));
            $remaining = $this->finance->statement($entry)['obligation_remaining'];
            $seen = [];
            foreach ($rows as $row) {
                $obligation = $entry->obligations()->lockForUpdate()->findOrFail($row['obligation_id']);
                $amount = Money::cents($row['amount']);
                $existing = $payment->allocations->firstWhere('student_obligation_id', $obligation->id);
                if ($existing) {
                    if ((int) $existing->amount_cents === $amount && $existing->reversals->isEmpty()) {
                        continue;
                    }
                    throw ValidationException::withMessages(['allocations' => 'Cette affectation existe déjà ; aucune réécriture silencieuse n’est permise.']);
                }
                if (isset($seen[$obligation->id]) || $amount <= 0 || $amount > $available || $amount > ($remaining[$obligation->id] ?? 0) || ($obligation->currency ?? $entry->currency) !== $payment->currency) {
                    throw ValidationException::withMessages(['allocations' => 'L’affectation doit respecter la devise, le reste dû et le montant disponible.']);
                }
                $seen[$obligation->id] = true;
                $available -= $amount;
                $allocation = $payment->allocations()->create(['student_obligation_id' => $obligation->id, 'amount_cents' => $amount, 'allocated_by' => $actor->id, 'created_at' => now()]);
                Audit::record($actor->id, 'payment_allocated', $allocation, $reason, ['payment_id' => $payment->id, 'obligation_id' => $obligation->id, 'amount_cents' => $amount]);
            }
            $this->finance->confirmPendingEnrollment($entry, $actor->id);
        }, 3);
    }
}
