<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\FinancialAdjustment;
use App\Models\Student\StudentObligation;
use App\Models\Student\StudentPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class StudentFinanceService
{
    public function activeAdjustments(AcademicEnrollment $entry)
    {
        return $entry->adjustments()->where('is_active', true)->where(fn ($q) => $q->whereNull('starts_at')->orWhereDate('starts_at', '<=', today('Africa/Kinshasa')))->where(fn ($q) => $q->whereNull('expires_at')->orWhereDate('expires_at', '>=', today('Africa/Kinshasa')))->get();
    }

    public function balance(AcademicEnrollment $entry, ?string $kind = null): array
    {
        if ($kind === null) {
            $kinds = $entry->obligations()->distinct()->pluck('kind');
            if ($kinds->isEmpty()) {
                return $this->balance($entry, 'tuition');
            }
            if ($kinds->count() === 1) {
                return $this->balance($entry, $kinds->first());
            }
            $balances = $kinds->map(fn ($type) => $this->balance($entry, $type));
            $result = ['assessed' => true, 'currency' => $entry->currency];
            foreach (['total_cents', 'waived_cents', 'due_cents', 'paid_cents', 'pending_cents', 'balance_cents', 'overdue_cents', 'credit_cents'] as $field) {
                $result[$field] = (int) $balances->sum($field);
            }
            $result['financial_clearance_status'] = $result['waived_cents'] === $result['total_cents'] && $result['total_cents'] > 0 ? 'exempted' : ($result['balance_cents'] === 0 ? 'cleared' : ($result['overdue_cents'] > 0 ? 'overdue' : ($result['paid_cents'] > 0 ? 'partial' : 'unpaid')));

            return $result;
        }
        $obligations = $entry->obligations()->where('kind', $kind)->orderBy('installment')->get();
        $total = (int) $obligations->sum('amount_cents');
        $adjustments = $this->activeAdjustments($entry)->where('fee_kind', $kind);
        $waived = $adjustments->where('type', 'exemption')->isNotEmpty() ? $total : min($total, (int) $adjustments->where('type', 'scholarship')->sum('amount_cents'));
        $paid = (int) $entry->payments()->where('kind', $kind)->where('currency', $entry->currency)->where('status', 'confirmed')->sum('amount_cents');
        $pending = (int) $entry->payments()->where('kind', $kind)->where('status', 'pending')->sum('amount_cents');
        $due = max(0, $total - $waived);
        $balance = max(0, $due - $paid);
        $overdue = max(0, (int) $obligations->filter(fn ($o) => $o->due_at && $o->due_at->lt(today('Africa/Kinshasa')))->sum('amount_cents') - $waived - $paid);

        return ['assessed' => $obligations->isNotEmpty(), 'currency' => $entry->currency, 'total_cents' => $total, 'waived_cents' => $waived, 'due_cents' => $due, 'paid_cents' => $paid, 'pending_cents' => $pending, 'balance_cents' => $balance, 'overdue_cents' => $overdue, 'credit_cents' => max(0, $paid - $due),
            'financial_clearance_status' => $obligations->isEmpty() ? 'unassessed' : ($waived === $total && $total > 0 ? 'exempted' : ($balance === 0 ? 'cleared' : ($overdue > 0 ? 'overdue' : ($paid > 0 ? 'partial' : 'unpaid'))))];
    }

    public function assess(AcademicEnrollment $entry, User $actor, string $category, array $dates = [], string $reason = ''): void
    {
        abort_unless($actor->can('manage academic finance'), 403);
        DB::transaction(function () use ($entry, $actor, $category, $dates, $reason) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            if ($entry->payments()->where('kind', 'tuition')->exists() || $entry->adjustments()->where('fee_kind', 'tuition')->exists()) {
                throw ValidationException::withMessages(['category' => 'Un historique financier existe : une réévaluation doit être traitée par la comptabilité.']);
            }
            $detail = $entry->level->detail;
            $first = $category === 'foreign' ? 'price_foreign_first' : 'price_national_first';
            $second = $category === 'foreign' ? 'price_foreign_second' : 'price_national_second';
            if (! $detail || $detail->$first === null || $detail->$second === null) {
                throw ValidationException::withMessages(['category' => 'Les deux tranches de ce tarif ne sont pas renseignées pour le niveau.']);
            }
            $before = $entry->obligations()->where('kind', 'tuition')->get(['installment', 'amount_cents', 'due_at'])->toArray();
            foreach ([$first, $second] as $index => $field) {
                StudentObligation::updateOrCreate(['academic_enrollment_id' => $entry->id, 'kind' => 'tuition', 'installment' => $index + 1], ['title' => 'Frais académiques · Tranche '.($index + 1), 'amount_cents' => Money::cents($detail->$field), 'due_at' => $dates[$index] ?? null]);
            }
            $entry->update(['fee_category' => $category]);
            Audit::record($actor->id, 'fees_assessed', $entry, $reason, ['category' => $category, 'dates' => $dates, 'previous' => $before, 'obligations' => $entry->obligations()->where('kind', 'tuition')->get(['installment', 'amount_cents', 'due_at'])->toArray()]);
        });
    }

    public function addObligation(AcademicEnrollment $entry, User $actor, array $data): void
    {
        abort_unless($actor->can('manage academic finance'), 403);
        DB::transaction(function () use ($entry, $actor, $data) {
            AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            if ($data['kind'] === 'tuition') {
                throw ValidationException::withMessages(['kind' => 'Utilisez le barème du niveau pour les frais académiques.']);
            }
            if ($entry->obligations()->where('kind', $data['kind'])->where('installment', $data['installment'])->exists()) {
                throw ValidationException::withMessages(['kind' => 'Cette obligation existe déjà.']);
            }
            $obligation = $entry->obligations()->create(['kind' => $data['kind'], 'title' => $data['title'], 'installment' => $data['installment'], 'amount_cents' => Money::cents($data['amount']), 'due_at' => $data['due_at'] ?? null]);
            Audit::record($actor->id, 'additional_fee_created', $obligation, $data['reason']);
        });
    }

    public function record(AcademicEnrollment $entry, User $actor, array $data): StudentPayment
    {
        abort_unless($actor->can('manage academic finance'), 403);

        return DB::transaction(function () use ($entry, $actor, $data) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            if (! $entry->obligations()->where('kind', $data['kind'] ?? 'tuition')->exists()) {
                throw ValidationException::withMessages(['amount' => 'Définissez les frais applicables avant de saisir un versement.']);
            }
            $amount = Money::cents($data['amount']);
            if ($amount <= 0) {
                throw ValidationException::withMessages(['amount' => 'Le versement doit être supérieur à zéro.']);
            }
            $payment = $entry->payments()->create(['uuid' => (string) Str::uuid(), 'amount_cents' => $amount, 'currency' => $entry->currency, 'kind' => $data['kind'] ?? 'tuition', 'method' => $data['method'], 'reference' => $data['reference'], 'note' => $data['note'] ?? null, 'status' => 'pending', 'recorded_by' => $actor->id]);
            Audit::record($actor->id, 'payment_recorded', $payment, $data['note'] ?? null);

            return $payment;
        });
    }

    public function transition(StudentPayment $payment, User $actor, string $status, string $reason): void
    {
        abort_unless($actor->can('manage academic finance'), 403);
        DB::transaction(function () use ($payment, $actor, $status, $reason) {
            AcademicEnrollment::lockForUpdate()->findOrFail($payment->academic_enrollment_id);
            $payment = StudentPayment::lockForUpdate()->findOrFail($payment->id);
            if ($payment->status === $status) {
                return;
            }
            $allowed = ($status === 'confirmed' && $payment->status === 'pending') || ($status === 'cancelled' && in_array($payment->status, ['pending', 'confirmed'])) || ($status === 'refunded' && $payment->status === 'confirmed');
            if (! $allowed) {
                throw ValidationException::withMessages(['payment' => 'Cette transition comptable n’est pas autorisée.']);
            }
            $from = $payment->status;
            $payment->update(['status' => $status, 'confirmed_by' => $status === 'confirmed' ? $actor->id : $payment->confirmed_by, 'confirmed_at' => $status === 'confirmed' ? now() : $payment->confirmed_at]);
            Audit::record($actor->id, 'payment_'.$status, $payment, $reason, ['from' => $from]);
        });
    }

    public function adjust(AcademicEnrollment $entry, User $actor, array $data): FinancialAdjustment
    {
        abort_unless($actor->can('manage academic finance'), 403);

        return DB::transaction(function () use ($entry, $actor, $data) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            $balance = $this->balance($entry, $data['fee_kind'] ?? 'tuition');
            if (! $balance['assessed']) {
                throw ValidationException::withMessages(['adjustment' => 'Confirmez d’abord la catégorie tarifaire.']);
            }
            $amount = isset($data['amount']) ? Money::cents($data['amount']) : null;
            if ($data['type'] === 'scholarship' && (! $amount || $amount > $balance['due_cents'])) {
                throw ValidationException::withMessages(['amount' => 'Indiquez un montant positif inférieur ou égal aux frais nets applicables.']);
            }
            $schedule = $data['schedule'] ?? null;
            if ($data['type'] === 'plan') {
                $schedule = collect($schedule ?? [])->map(fn ($row) => ['due_at' => $row['due_at'], 'amount_cents' => Money::cents($row['amount'])])->all();
                if (! $schedule || array_sum(array_column($schedule, 'amount_cents')) !== $balance['due_cents']) {
                    throw ValidationException::withMessages(['schedule' => 'L’échéancier doit couvrir exactement les frais nets applicables.']);
                }
            }
            $adjustment = $entry->adjustments()->create(['type' => $data['type'], 'fee_kind' => $data['fee_kind'] ?? 'tuition', 'feature' => $data['feature'] ?? null, 'amount_cents' => $amount, 'starts_at' => $data['starts_at'] ?? null, 'expires_at' => $data['expires_at'] ?? null, 'reason' => $data['reason'], 'authorized_by' => $actor->id, 'schedule' => $schedule]);
            Audit::record($actor->id, 'financial_adjustment_approved', $adjustment, $data['reason']);

            return $adjustment;
        });
    }
}
