<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\FinancialAdjustment;
use App\Models\Student\StudentObligation;
use App\Models\Student\StudentPayment;
use App\Models\User;
use App\Notifications\FinancialOperationNotice;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class StudentFinanceService
{
    public function authorize(AcademicEnrollment $entry, User $actor): void
    {
        abort_unless($actor->hasRole('admin') && $actor->can('manage academic finance'), 403);
        Gate::forUser($actor)->authorize('view', $entry);
    }

    public function activeAdjustments(AcademicEnrollment $entry)
    {
        return $entry->adjustments()->where('is_active', true)->where(fn ($q) => $q->whereNull('starts_at')->orWhereDate('starts_at', '<=', today('Africa/Kinshasa')))->where(fn ($q) => $q->whereNull('expires_at')->orWhereDate('expires_at', '>=', today('Africa/Kinshasa')))->get();
    }

    public function statement(AcademicEnrollment $entry): array
    {
        $obligations = $entry->obligations()->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')->orderBy('due_at')->orderBy('installment')->orderBy('id')->get();
        if ($obligations->contains(fn ($o) => $o->currency !== null && $o->currency !== $entry->currency)) {
            throw ValidationException::withMessages(['currency' => 'Des obligations utilisent une devise incompatible. Un contrôle financier est requis.']);
        }
        $payments = $entry->payments()->with(['allocations.obligation', 'allocations.reversals', 'refunds'])->get();
        $adjustments = $this->activeAdjustments($entry);
        $legacy = [];
        $explicit = [];
        $pending = [];
        $unallocated = 0;
        $refundTotal = 0;
        foreach ($payments as $payment) {
            if ($payment->currency !== $entry->currency) {
                continue;
            }
            $refunded = (int) $payment->refunds->where('status', 'executed')->sum('amount_cents');
            $refundTotal += $refunded;
            if ($payment->status === 'pending') {
                $pending[$payment->kind] = ($pending[$payment->kind] ?? 0) + (int) $payment->amount_cents;

                continue;
            }
            if ($payment->status !== 'confirmed') {
                continue;
            }
            $net = max(0, (int) $payment->amount_cents - $refunded);
            if ($payment->allocations->isEmpty() && $payment->kind !== 'unallocated') {
                $legacy[$payment->kind] = ($legacy[$payment->kind] ?? 0) + $net;
            } else {
                $allocated = 0;
                foreach ($payment->allocations as $allocation) {
                    $amount = max(0, (int) $allocation->amount_cents - (int) $allocation->reversals->sum('amount_cents'));
                    $explicit[$allocation->student_obligation_id] = ($explicit[$allocation->student_obligation_id] ?? 0) + $amount;
                    $allocated += $amount;
                }
                $unallocated += max(0, $net - $allocated);
            }
        }
        $groups = $obligations->groupBy('kind');
        $kinds = $groups->keys()->merge(array_keys($legacy))->merge(array_keys($pending))->reject(fn ($kind) => $kind === 'unallocated')->unique();
        $balances = [];
        $schedules = [];
        $remainingByObligation = [];
        foreach ($kinds as $kind) {
            $rows = $groups->get($kind, collect());
            $total = (int) $rows->sum('amount_cents');
            $aids = $adjustments->where('fee_kind', $kind)->where('funding_source', '!=', 'third_party');
            $waived = $aids->contains('type', 'exemption') ? $total : min($total, (int) $aids->whereIn('type', ['scholarship', 'reduction'])->sum('amount_cents'));
            $paid = ($legacy[$kind] ?? 0) + (int) $rows->sum(fn ($row) => $explicit[$row->id] ?? 0);
            $due = max(0, $total - $waived);
            $coverage = $waived + ($legacy[$kind] ?? 0);
            $schedule = [];
            foreach ($rows as $row) {
                $outstanding = max(0, (int) $row->amount_cents - ($explicit[$row->id] ?? 0));
                $used = min($coverage, $outstanding);
                $coverage -= $used;
                $outstanding -= $used;
                $remainingByObligation[$row->id] = $outstanding;
                $schedule[] = ['id' => $row->id, 'kind' => $kind, 'title' => $row->title, 'amount_cents' => (int) $row->amount_cents, 'remaining_cents' => $outstanding, 'due_at' => $row->due_at?->toDateString()];
            }
            $plan = $adjustments->where('type', 'plan')->where('fee_kind', $kind)->sortByDesc('id')->first();
            $validPlan = $plan && array_sum(array_column($plan->schedule ?? [], 'amount_cents')) === $due;
            if ($validPlan) {
                $coverage = $paid;
                $schedule = [];
                foreach (collect($plan->schedule)->sortBy('due_at') as $index => $row) {
                    $used = min($coverage, (int) $row['amount_cents']);
                    $coverage -= $used;
                    $schedule[] = ['id' => 'plan-'.$plan->id.'-'.$index, 'kind' => $kind, 'title' => 'Échéance approuvée', 'amount_cents' => (int) $row['amount_cents'], 'remaining_cents' => (int) $row['amount_cents'] - $used, 'due_at' => $row['due_at']];
                }
            }
            $overdue = 0;
            foreach ($schedule as &$row) {
                $late = $row['due_at'] !== null && $row['due_at'] < today('Africa/Kinshasa')->toDateString();
                $row['status'] = $row['remaining_cents'] === 0 ? 'paid' : ($late ? 'overdue' : ($row['remaining_cents'] < $row['amount_cents'] ? 'partial' : 'upcoming'));
                if ($late) {
                    $overdue += $row['remaining_cents'];
                }
            }
            unset($row);
            $schedules[$kind] = $schedule;
            $balance = max(0, $due - $paid);
            $balances[$kind] = ['assessed' => $rows->isNotEmpty(), 'currency' => $entry->currency, 'total_cents' => $total, 'waived_cents' => $waived, 'due_cents' => $due, 'paid_cents' => $paid, 'pending_cents' => $pending[$kind] ?? 0, 'balance_cents' => $balance, 'overdue_cents' => $overdue, 'credit_cents' => max(0, $paid - $due), 'plan_valid' => ! $plan || $validPlan,
                'financial_clearance_status' => $rows->isEmpty() ? 'unassessed' : ($waived === $total && $total > 0 ? 'exempted' : ($balance === 0 ? 'cleared' : ($overdue > 0 ? 'overdue' : ($paid > 0 ? 'partial' : 'unpaid'))))];
        }
        $summary = ['assessed' => $obligations->isNotEmpty(), 'currency' => $entry->currency];
        foreach (['total_cents', 'waived_cents', 'due_cents', 'paid_cents', 'pending_cents', 'balance_cents', 'overdue_cents', 'credit_cents'] as $field) {
            $summary[$field] = (int) collect($balances)->sum($field);
        }
        $summary['paid_cents'] += $unallocated;
        $summary['credit_cents'] += $unallocated;
        $summary['pending_cents'] += $pending['unallocated'] ?? 0;
        $summary['unallocated_cents'] = $unallocated;
        $summary['refunded_cents'] = $refundTotal;
        $summary['financial_clearance_status'] = ! $summary['assessed'] ? 'unassessed' : ($summary['total_cents'] > 0 && $summary['waived_cents'] === $summary['total_cents'] ? 'exempted' : ($summary['balance_cents'] === 0 ? 'cleared' : ($summary['overdue_cents'] > 0 ? 'overdue' : ($summary['paid_cents'] > 0 ? 'partial' : 'unpaid'))));

        return ['balance' => $summary, 'kinds' => $balances, 'schedules' => $schedules, 'obligation_remaining' => $remainingByObligation];
    }

    public function balance(AcademicEnrollment $entry, ?string $kind = null): array
    {
        $statement = $this->statement($entry);

        return $kind === null ? $statement['balance'] : ($statement['kinds'][$kind] ?? ['assessed' => false, 'currency' => $entry->currency, 'total_cents' => 0, 'waived_cents' => 0, 'due_cents' => 0, 'paid_cents' => 0, 'pending_cents' => 0, 'balance_cents' => 0, 'overdue_cents' => 0, 'credit_cents' => 0, 'financial_clearance_status' => 'unassessed']);
    }

    public function firstTuitionInstallmentCovered(AcademicEnrollment $entry): bool
    {
        $first = $entry->obligations()->where('kind', 'tuition')->where('installment', 1)->first();
        if ($first === null) {
            return false;
        }

        $balance = $this->balance($entry, 'tuition');

        return $first->amount_cents <= $balance['paid_cents'] + $balance['waived_cents'];
    }

    /** The caller must hold the enrollment row lock inside a transaction. */
    public function confirmPendingEnrollment(AcademicEnrollment $entry, ?int $actorId = null): void
    {
        app(EnrollmentFinancialConfirmation::class)->apply($entry, $actorId, $this->firstTuitionInstallmentCovered($entry));
    }

    public function assess(AcademicEnrollment $entry, User $actor, string $category, array $dates = [], string $reason = ''): void
    {
        $this->authorize($entry, $actor);
        DB::transaction(function () use ($entry, $actor, $category, $dates, $reason) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            if ($entry->obligations()->where('kind', 'tuition')->exists() && $entry->fee_category === $category) {
                return;
            }
            if ($entry->payments()->where('kind', 'tuition')->exists() || $entry->adjustments()->where('fee_kind', 'tuition')->exists()) {
                throw ValidationException::withMessages(['category' => 'Un historique financier existe : une réévaluation doit être traitée par la comptabilité.']);
            }
            if (! $this->applyTuitionTariff($entry, $actor->id, $category, $dates, $reason)) {
                throw ValidationException::withMessages(['category' => 'Les deux tranches de ce tarif ne sont pas renseignées pour le niveau.']);
            }
        });
    }

    /** Apply the level tariff to a locked enrollment, or to one just created in the same transaction. */
    public function applyTuitionTariff(AcademicEnrollment $entry, int $actorId, string $category, array $dates, string $reason): bool
    {
        if ($entry->obligations()->where('kind', 'tuition')->exists()) {
            if ($entry->fee_category !== $category) {
                throw ValidationException::withMessages(['category' => 'Les obligations émises sont historiques. Une correction exige une décision distincte.']);
            }

            return true;
        }
        if ($tariff = app(FeeTariffService::class)->resolve($entry, $category)) {
            app(FeeTariffService::class)->bill($tariff, $entry, User::findOrFail($actorId), $reason);

            return true;
        }
        if ($entry->currency !== config('student.currency')) {
            throw ValidationException::withMessages(['category' => 'Un barème explicite dans cette devise est requis ; aucune conversion implicite n’est autorisée.']);
        }
        $detail = $entry->level->detail;
        $first = $category === 'foreign' ? 'price_foreign_first' : 'price_national_first';
        $second = $category === 'foreign' ? 'price_foreign_second' : 'price_national_second';
        if (! $detail || $detail->$first === null || $detail->$second === null) {
            return false;
        }

        $before = $entry->obligations()->where('kind', 'tuition')->get(['installment', 'amount_cents', 'due_at'])->toArray();
        foreach ([$first, $second] as $index => $field) {
            StudentObligation::create(['academic_enrollment_id' => $entry->id, 'kind' => 'tuition', 'installment' => $index + 1, 'currency' => $entry->currency, 'source_snapshot' => ['source' => 'level_details', 'level_id' => $entry->level_id, 'category' => $category, 'amount' => (string) $detail->$field], 'title' => 'Frais académiques · Tranche '.($index + 1), 'amount_cents' => Money::cents($detail->$field), 'due_at' => $dates[$index] ?? null]);
        }
        $entry->update(['fee_category' => $category]);
        Audit::record($actorId, 'fees_assessed', $entry, $reason, ['category' => $category, 'dates' => $dates, 'previous' => $before, 'obligations' => $entry->obligations()->where('kind', 'tuition')->get(['installment', 'amount_cents', 'due_at'])->toArray()]);
        $this->confirmPendingEnrollment($entry, $actorId);

        return true;
    }

    public function addObligation(AcademicEnrollment $entry, User $actor, array $data): void
    {
        $this->authorize($entry, $actor);
        DB::transaction(function () use ($entry, $actor, $data) {
            AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            if ($data['kind'] === 'tuition') {
                throw ValidationException::withMessages(['kind' => 'Utilisez le barème du niveau pour les frais académiques.']);
            }
            if ($entry->obligations()->where('kind', $data['kind'])->where('installment', $data['installment'])->exists()) {
                throw ValidationException::withMessages(['kind' => 'Cette obligation existe déjà.']);
            }
            $obligation = $entry->obligations()->create(['kind' => $data['kind'], 'title' => $data['title'], 'installment' => $data['installment'], 'currency' => $entry->currency, 'source_snapshot' => ['source' => 'administrative_decision', 'actor_id' => $actor->id, 'reason' => $data['reason']], 'amount_cents' => Money::cents($data['amount']), 'due_at' => $data['due_at'] ?? null]);
            Audit::record($actor->id, 'additional_fee_created', $obligation, $data['reason']);
        });
    }

    public function record(AcademicEnrollment $entry, User $actor, array $data): StudentPayment
    {
        $this->authorize($entry, $actor);
        if (! in_array($data['method'] ?? null, config('finance.methods'), true)) {
            throw ValidationException::withMessages(['method' => 'Mode de paiement non disponible.']);
        }

        try {
            return DB::transaction(function () use ($entry, $actor, $data) {
                $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
                if (($data['kind'] ?? 'tuition') !== 'unallocated' && ! $entry->obligations()->where('kind', $data['kind'] ?? 'tuition')->exists()) {
                    throw ValidationException::withMessages(['amount' => 'Définissez les frais applicables avant de saisir un versement.']);
                }
                $amount = Money::cents($data['amount']);
                if ($amount <= 0) {
                    throw ValidationException::withMessages(['amount' => 'Le versement doit être supérieur à zéro.']);
                }
                $existing = StudentPayment::where('reference', $data['reference'])->first();
                if ($existing) {
                    if ((int) $existing->academic_enrollment_id === (int) $entry->id && (int) $existing->amount_cents === $amount && $existing->currency === $entry->currency && $existing->kind === ($data['kind'] ?? 'tuition') && $existing->method === $data['method']) {
                        return $existing;
                    }
                    throw ValidationException::withMessages(['reference' => 'Cette référence est déjà utilisée par une autre écriture.']);
                }
                $payment = $entry->payments()->create(['uuid' => (string) Str::uuid(), 'amount_cents' => $amount, 'currency' => $entry->currency, 'kind' => $data['kind'] ?? 'tuition', 'method' => $data['method'], 'reference' => $data['reference'], 'note' => $data['note'] ?? null, 'status' => 'pending', 'recorded_by' => $actor->id]);
                Audit::record($actor->id, 'payment_recorded', $payment, $data['note'] ?? null);

                return $payment;
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            throw ValidationException::withMessages(['reference' => 'Cette référence de paiement est déjà utilisée.']);
        }
    }

    public function transition(StudentPayment $payment, User $actor, string $status, string $reason, bool $notify = true): void
    {
        $this->authorize($payment->enrollment, $actor);
        DB::transaction(function () use ($payment, $actor, $status, $reason, $notify) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($payment->academic_enrollment_id);
            $payment = StudentPayment::lockForUpdate()->findOrFail($payment->id);
            if ($payment->status === $status) {
                return;
            }
            if ($status === 'refunded') {
                throw ValidationException::withMessages(['payment' => 'Utilisez une demande de remboursement, son autorisation puis la confirmation du décaissement.']);
            }
            if ($status === 'confirmed' && config('finance.dual_control') && (int) $payment->recorded_by === (int) $actor->id) {
                throw ValidationException::withMessages(['payment' => 'Un autre agent doit contrôler ce versement.']);
            }
            $allowed = ($status === 'confirmed' && $payment->status === 'pending') || ($status === 'cancelled' && in_array($payment->status, ['pending', 'confirmed'])) || ($status === 'refunded' && $payment->status === 'confirmed');
            if (! $allowed) {
                throw ValidationException::withMessages(['payment' => 'Cette transition comptable n’est pas autorisée.']);
            }
            if ($status === 'cancelled' && $payment->refunds()->whereIn('status', ['requested', 'approved', 'executed'])->exists()) {
                throw ValidationException::withMessages(['payment' => 'Une procédure de remboursement existe. Traitez-la avant toute contrepassation.']);
            }
            $from = $payment->status;
            FinanceMutation::run(fn () => $payment->update(['status' => $status, 'confirmed_by' => $status === 'confirmed' ? $actor->id : $payment->confirmed_by, 'confirmed_at' => $status === 'confirmed' ? now() : $payment->confirmed_at]));
            if ($status === 'confirmed') {
                app(FinanceReceiptService::class)->capture($payment, $entry);
            }
            if ($notify) {
                $this->notifyPayment($payment, $entry);
            }
            Audit::record($actor->id, 'payment_'.$status, $payment, $reason, ['from' => $from, 'to' => $status, 'academic_enrollment_id' => $entry->id]);
            if ($status === 'confirmed' && $payment->kind === 'tuition') {
                $this->confirmPendingEnrollment($entry, $actor->id);
            }
        });
    }

    public function adjust(AcademicEnrollment $entry, User $actor, array $data): FinancialAdjustment
    {
        $this->authorize($entry, $actor);

        return DB::transaction(function () use ($entry, $actor, $data) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            $balance = $this->balance($entry, $data['fee_kind'] ?? 'tuition');
            if (! $balance['assessed']) {
                throw ValidationException::withMessages(['adjustment' => 'Confirmez d’abord la catégorie tarifaire.']);
            }
            if (! empty($data['operation_key']) && ($existing = $entry->adjustments()->where('operation_key', $data['operation_key'])->first())) {
                $hashData = $data;
                unset($hashData['operation_key']);
                ksort($hashData);
                if ($existing->request_hash !== hash('sha256', json_encode($hashData))) {
                    throw ValidationException::withMessages(['operation_key' => 'Cette clé désigne une autre aide.']);
                }

                return $existing;
            }
            if (! in_array($data['type'], ['scholarship', 'reduction', 'exemption', 'plan', 'override'], true)) {
                throw ValidationException::withMessages(['type' => 'Décision financière inconnue.']);
            }
            $funding = $data['funding_source'] ?? 'institution';
            if (! in_array($funding, ['institution', 'third_party'], true)) {
                throw ValidationException::withMessages(['funding_source' => 'Source de financement inconnue.']);
            }
            if ($funding === 'third_party' && $data['type'] !== 'scholarship') {
                throw ValidationException::withMessages(['funding_source' => 'Une prise en charge de tiers doit être enregistrée comme bourse attendue.']);
            }
            if (isset($data['amount'], $data['percentage'])) {
                throw ValidationException::withMessages(['percentage' => 'Choisissez un montant fixe ou un pourcentage, pas les deux.']);
            }
            $basis = isset($data['percentage']) ? Money::cents($data['percentage']) : null;
            if ($basis !== null && ($basis <= 0 || $basis > 10000)) {
                throw ValidationException::withMessages(['percentage' => 'Le pourcentage doit être compris entre 0 et 100.']);
            }
            $amount = isset($data['amount']) ? Money::cents($data['amount']) : null;
            if ($basis !== null) {
                $amount = intdiv($balance['total_cents'] * $basis + 5000, 10000);
            }
            if (in_array($data['type'], ['scholarship', 'reduction', 'exemption'], true)) {
                $overlaps = $entry->adjustments()->where('fee_kind', $data['fee_kind'] ?? 'tuition')->where('is_active', true)->whereIn('type', ['scholarship', 'reduction', 'exemption'])
                    ->where('funding_source', 'institution')->where(fn ($q) => $q->whereNull('starts_at')->orWhereDate('starts_at', '<=', $data['expires_at'] ?? '9999-12-31'))
                    ->where(fn ($q) => $q->whereNull('expires_at')->orWhereDate('expires_at', '>=', $data['starts_at'] ?? '0001-01-01'))->get();
                if ($funding === 'institution' && $overlaps->contains(fn ($a) => $a->type === 'exemption' || $data['type'] === 'exemption' || ! $a->stackable || ! ($data['stackable'] ?? false))) {
                    throw ValidationException::withMessages(['adjustment' => 'Ces aides se chevauchent et ne sont pas cumulables.']);
                }
                if ($funding === 'institution' && $this->activeAdjustments($entry)->where('fee_kind', $data['fee_kind'] ?? 'tuition')->contains('type', 'plan')) {
                    throw ValidationException::withMessages(['adjustment' => 'Révoquez puis réaménagez l’échéancier avant de modifier les frais nets.']);
                }
            }
            if (in_array($data['type'], ['scholarship', 'reduction'], true) && (! $amount || $amount > $balance['due_cents'])) {
                throw ValidationException::withMessages(['amount' => 'Indiquez un montant positif inférieur ou égal aux frais nets applicables.']);
            }
            $schedule = $data['schedule'] ?? null;
            if ($data['type'] === 'plan') {
                if (count($schedule ?? []) > 24) {
                    throw ValidationException::withMessages(['schedule' => 'Limite de 24 échéances dépassée.']);
                }
                validator(['schedule' => $schedule], ['schedule.*.due_at' => 'required|date_format:Y-m-d'])->validate();
                $schedule = collect($schedule ?? [])->map(fn ($row) => ['due_at' => $row['due_at'], 'amount_cents' => Money::cents($row['amount'])])->sortBy('due_at')->values()->all();
                if (collect($schedule)->contains(fn ($row) => $row['amount_cents'] <= 0)) {
                    throw ValidationException::withMessages(['schedule' => 'Chaque échéance doit être positive.']);
                }
                if (! $schedule || array_sum(array_column($schedule, 'amount_cents')) !== $balance['due_cents']) {
                    throw ValidationException::withMessages(['schedule' => 'L’échéancier doit couvrir exactement les frais nets applicables.']);
                }
            }
            if ($data['type'] === 'plan') {
                foreach ($entry->adjustments()->where('type', 'plan')->where('fee_kind', $data['fee_kind'] ?? 'tuition')->where('is_active', true)->get() as $oldPlan) {
                    $oldPlan->update(['is_active' => false]);
                    Audit::record($actor->id, 'financial_plan_replaced', $oldPlan, $data['reason']);
                }
            }
            $adjustment = $entry->adjustments()->create(['type' => $data['type'], 'fee_kind' => $data['fee_kind'] ?? 'tuition', 'feature' => $data['feature'] ?? null, 'amount_cents' => $amount, 'starts_at' => $data['starts_at'] ?? null, 'expires_at' => $data['expires_at'] ?? null, 'reason' => $data['reason'], 'authorized_by' => $actor->id, 'percentage_basis_points' => $basis, 'funding_source' => $funding, 'stackable' => $data['stackable'] ?? false, 'operation_key' => $data['operation_key'] ?? null, 'request_hash' => (function () use ($data) {
                unset($data['operation_key']);
                ksort($data);

                return hash('sha256', json_encode($data));
            })(), 'schedule' => $schedule]);
            Audit::record($actor->id, 'financial_adjustment_approved', $adjustment, $data['reason']);
            if ($adjustment->fee_kind === 'tuition' && in_array($adjustment->type, ['exemption', 'scholarship', 'reduction'], true)) {
                $this->confirmPendingEnrollment($entry, $actor->id);
            }

            return $adjustment;
        });
    }

    public function revokeAdjustment(FinancialAdjustment $adjustment, User $actor, string $reason): void
    {
        $entry = AcademicEnrollment::findOrFail($adjustment->academic_enrollment_id);
        $this->authorize($entry, $actor);
        DB::transaction(function () use ($entry, $adjustment, $actor, $reason) {
            AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            $adjustment = FinancialAdjustment::lockForUpdate()->findOrFail($adjustment->id);
            if (! $adjustment->is_active) {
                return;
            }
            if (in_array($adjustment->type, ['scholarship', 'reduction', 'exemption'], true) && $this->activeAdjustments($entry)->where('fee_kind', $adjustment->fee_kind)->contains('type', 'plan')) {
                throw ValidationException::withMessages(['adjustment' => 'Révoquez puis réaménagez le plan avant de modifier les frais nets.']);
            }
            $adjustment->update(['is_active' => false]);
            Audit::record($actor->id, 'financial_adjustment_revoked', $adjustment, $reason, ['from' => true, 'to' => false, 'academic_enrollment_id' => $entry->id]);
        }, 3);
    }

    public function annotate(StudentPayment $payment, User $actor, string $note, string $reason): void
    {
        $this->authorize($payment->enrollment, $actor);
        DB::transaction(function () use ($payment, $actor, $note, $reason) {
            $payment = StudentPayment::lockForUpdate()->findOrFail($payment->id);
            if ($payment->note === $note) {
                return;
            }
            $before = $payment->note;
            FinanceMutation::run(fn () => $payment->update(['note' => $note]));
            Audit::record($actor->id, 'payment_note_amended', $payment, $reason, ['before' => $before, 'after' => $note]);
        }, 3);
    }

    public function notifyPayment(StudentPayment $payment, AcademicEnrollment $entry, ?string $status = null): void
    {
        $entry->profile->user->notify(new FinancialOperationNotice(['academic_enrollment_id' => $entry->id, 'reference' => $payment->reference, 'status' => $status ?? $payment->status]));
    }
}
