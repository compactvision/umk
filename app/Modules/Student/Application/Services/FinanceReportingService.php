<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\PaymentRefund;
use App\Models\Student\StudentObligation;
use App\Models\Student\StudentPayment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class FinanceReportingService
{
    public function entries(User $actor, array $filters)
    {
        return app(AcademicEnrollmentReadService::class)->query($actor, $filters);
    }

    public function totals(User $actor, array $filters): array
    {
        $ids = $this->entries($actor, $filters)->select('academic_enrollments.id');
        $billed = StudentObligation::join('academic_enrollments', 'academic_enrollments.id', '=', 'student_obligations.academic_enrollment_id')
            ->whereIn('academic_enrollments.id', $ids)->selectRaw('academic_enrollments.currency, SUM(student_obligations.amount_cents) AS billed_cents')->groupBy('academic_enrollments.currency')->get()->keyBy('currency');
        $cash = StudentPayment::whereIn('academic_enrollment_id', $ids)->selectRaw("currency, SUM(CASE WHEN status IN ('confirmed','refunded') THEN amount_cents ELSE 0 END) AS gross_cents, SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END) AS pending_cents, SUM(CASE WHEN status = 'cancelled' THEN amount_cents ELSE 0 END) AS cancelled_cents, SUM(CASE WHEN status = 'refunded' AND NOT EXISTS (SELECT 1 FROM student_payment_refunds r WHERE r.student_payment_id = student_payments.id AND r.status = 'executed') THEN amount_cents ELSE 0 END) AS legacy_reversal_cents")->groupBy('currency')->get()->keyBy('currency');
        $refunds = PaymentRefund::join('student_payments', 'student_payments.id', '=', 'student_payment_refunds.student_payment_id')->whereIn('student_payments.academic_enrollment_id', $ids)->where('student_payment_refunds.status', 'executed')->selectRaw('student_payments.currency, SUM(student_payment_refunds.amount_cents) AS refunded_cents')->groupBy('student_payments.currency')->get()->keyBy('currency');
        $debt = $this->debtTotals($ids);

        return $billed->keys()->merge($cash->keys())->merge($refunds->keys())->unique()->sort()->map(fn ($currency) => [
            'currency' => $currency, 'waived_cents' => (int) ($debt[$currency]['waived_cents'] ?? 0), 'due_cents' => (int) ($debt[$currency]['due_cents'] ?? 0), 'balance_cents' => (int) ($debt[$currency]['balance_cents'] ?? 0), 'overdue_cents' => (int) ($debt[$currency]['overdue_cents'] ?? 0), 'billed_cents' => (int) ($billed[$currency]->billed_cents ?? 0), 'gross_cents' => (int) ($cash[$currency]->gross_cents ?? 0),
            'pending_cents' => (int) ($cash[$currency]->pending_cents ?? 0), 'cancelled_cents' => (int) ($cash[$currency]->cancelled_cents ?? 0),
            'refunded_cents' => (int) ($refunds[$currency]->refunded_cents ?? 0), 'legacy_reversal_cents' => (int) ($cash[$currency]->legacy_reversal_cents ?? 0),
            'net_cents' => (int) ($cash[$currency]->gross_cents ?? 0) - (int) ($refunds[$currency]->refunded_cents ?? 0) - (int) ($cash[$currency]->legacy_reversal_cents ?? 0),
        ])->values()->all();
    }

    public function cashflow(User $actor, array $filters): array
    {
        $ids = $this->entries($actor, $filters)->select('academic_enrollments.id');
        $receipts = DB::table('student_payments')->whereIn('academic_enrollment_id', $ids)
            ->whereIn('status', ['confirmed', 'refunded'])->whereNotNull('confirmed_at');
        $refunds = DB::table('student_payment_refunds as refunds')->join('student_payments as payments', 'payments.id', '=', 'refunds.student_payment_id')
            ->whereIn('payments.academic_enrollment_id', $ids)->where('refunds.status', 'executed')->whereNotNull('refunds.executed_at');
        $dates = (clone $receipts)->selectRaw('MAX(confirmed_at) AS posted_at')
            ->unionAll((clone $refunds)->selectRaw('MAX(refunds.executed_at) AS posted_at'));
        $latest = DB::query()->fromSub($dates, 'cash_dates')->max('posted_at');
        $end = ($latest ? CarbonImmutable::parse($latest, 'UTC')->timezone('Africa/Kinshasa') : CarbonImmutable::now('Africa/Kinshasa'))->startOfMonth();
        $start = $end->subMonths(11);
        $months = array_map(fn (int $offset) => $start->addMonths($offset), range(0, 11));

        $gross = $this->monthlyAmounts($receipts, 'currency', 'amount_cents', 'confirmed_at', $months);
        $refunded = $this->monthlyAmounts($refunds, 'payments.currency', 'refunds.amount_cents', 'refunds.executed_at', $months);
        $series = $gross->keys()->merge($refunded->keys())->unique()->sort()->map(fn (string $currency) => [
            'currency' => $currency,
            'months' => array_map(function (CarbonImmutable $month, int $index) use ($gross, $refunded, $currency) {
                $received = (int) ($gross[$currency]->{'month_'.$index} ?? 0);
                $returned = (int) ($refunded[$currency]->{'month_'.$index} ?? 0);

                return ['month' => $month->format('Y-m'), 'gross_cents' => $received, 'refunded_cents' => $returned, 'net_cents' => $received - $returned];
            }, $months, array_keys($months)),
        ])->values()->all();

        return ['start_month' => $start->format('Y-m'), 'end_month' => $end->format('Y-m'), 'series' => $series];
    }

    public function breakdowns(User $actor, array $filters): array
    {
        $ids = $this->entries($actor, $filters)->select('academic_enrollments.id');
        $rows = $this->debtReport($ids)
            ->join('levels', 'levels.id', '=', 'f.level_id')
            ->join('faculties', 'faculties.id', '=', 'levels.faculty_id')
            ->addSelect(['faculties.id as faculty_id', 'faculties.name as faculty_name', 'f.kind'])
            ->groupBy('f.currency', 'faculties.id', 'faculties.name', 'f.kind')
            ->orderBy('faculties.name')->orderBy('f.kind')->orderBy('faculties.id')->get();
        $fields = ['billed_cents', 'waived_cents', 'due_cents', 'covered_cents', 'balance_cents', 'overdue_cents'];
        $amounts = array_fill_keys($fields, 0);
        $faculties = [];
        $feeKinds = [];

        foreach ($rows as $row) {
            $facultyKey = $row->currency.':'.$row->faculty_id;
            $kindKey = $row->currency.':'.$row->kind;
            $faculties[$facultyKey] ??= ['currency' => $row->currency, 'faculty_id' => (int) $row->faculty_id, 'faculty_name' => $row->faculty_name] + $amounts;
            $feeKinds[$kindKey] ??= ['currency' => $row->currency, 'kind' => $row->kind] + $amounts;

            foreach ($fields as $field) {
                $faculties[$facultyKey][$field] += (int) $row->{$field};
                $feeKinds[$kindKey][$field] += (int) $row->{$field};
            }
        }

        $order = fn (array $first, array $second) => [$first['currency'], -$first['balance_cents']] <=> [$second['currency'], -$second['balance_cents']];
        usort($faculties, $order);
        usort($feeKinds, $order);

        return ['faculties' => $faculties, 'fee_kinds' => $feeKinds];
    }

    /** @param list<CarbonImmutable> $months */
    private function monthlyAmounts(Builder $query, string $currency, string $amount, string $date, array $months): Collection
    {
        $query->select($currency.' as currency')->groupBy($currency);
        foreach ($months as $index => $month) {
            $query->selectRaw("SUM(CASE WHEN $date >= ? AND $date < ? THEN $amount ELSE 0 END) AS month_$index", [
                $month->utc()->toDateTimeString(),
                $month->addMonth()->utc()->toDateTimeString(),
            ]);
        }

        return $query->where($date, '>=', $months[0]->utc()->toDateTimeString())
            ->where($date, '<', $months[array_key_last($months)]->addMonth()->utc()->toDateTimeString())
            ->get()->keyBy('currency');
    }

    private function debtTotals($ids): array
    {
        return $this->debtReport($ids)->groupBy('f.currency')->get()->keyBy('currency')->map(fn ($row) => (array) $row)->all();
    }

    private function debtReport($ids): Builder
    {
        $today = today('Africa/Kinshasa')->toDateString();
        $reversals = DB::table('student_refund_allocations')->selectRaw('student_payment_allocation_id, SUM(amount_cents) AS reversed')->groupBy('student_payment_allocation_id');
        $allocated = DB::table('student_payment_allocations as pa')->join('student_payments as p', 'p.id', '=', 'pa.student_payment_id')
            ->join('academic_enrollments as pe', 'pe.id', '=', 'p.academic_enrollment_id')->where('p.status', 'confirmed')->whereColumn('p.currency', 'pe.currency')
            ->leftJoinSub($reversals, 'rev', 'rev.student_payment_allocation_id', '=', 'pa.id')
            ->selectRaw('pa.student_obligation_id, SUM(pa.amount_cents - COALESCE(rev.reversed, 0)) AS allocated')->groupBy('pa.student_obligation_id');
        $bills = DB::table('student_obligations as o')->join('academic_enrollments as e', 'e.id', '=', 'o.academic_enrollment_id')->whereIn('e.id', $ids)
            ->where(fn ($q) => $q->whereNull('o.currency')->orWhereColumn('o.currency', 'e.currency'))
            ->leftJoinSub($allocated, 'a', 'a.student_obligation_id', '=', 'o.id')
            ->selectRaw('o.academic_enrollment_id, o.kind, e.currency, e.level_id, SUM(o.amount_cents) AS total_cents, SUM(COALESCE(a.allocated,0)) AS explicit_paid, SUM(CASE WHEN o.due_at < ? THEN CASE WHEN o.amount_cents > COALESCE(a.allocated,0) THEN o.amount_cents - COALESCE(a.allocated,0) ELSE 0 END ELSE 0 END) AS overdue_gross', [$today])
            ->groupBy('o.academic_enrollment_id', 'o.kind', 'e.currency', 'e.level_id');
        $active = function ($q, string $alias) use ($today) {
            return $q->where($alias.'.is_active', true)->where(fn ($q) => $q->whereNull($alias.'.starts_at')->orWhereDate($alias.'.starts_at', '<=', $today))->where(fn ($q) => $q->whereNull($alias.'.expires_at')->orWhereDate($alias.'.expires_at', '>=', $today));
        };
        $waivers = $active(DB::table('student_financial_adjustments as wa'), 'wa')->where('funding_source', 'institution')->whereIn('type', ['exemption', 'scholarship', 'reduction'])
            ->selectRaw("academic_enrollment_id, fee_kind, MAX(CASE WHEN type='exemption' THEN 1 ELSE 0 END) AS exempted, SUM(COALESCE(amount_cents,0)) AS waived")->groupBy('academic_enrollment_id', 'fee_kind');
        $refunded = DB::table('student_payment_refunds')->where('status', 'executed')->selectRaw('student_payment_id, SUM(amount_cents) AS refunded')->groupBy('student_payment_id');
        $legacy = DB::table('student_payments as lp')->join('academic_enrollments as le', 'le.id', '=', 'lp.academic_enrollment_id')->whereColumn('lp.currency', 'le.currency')
            ->where('lp.status', 'confirmed')->where('lp.kind', '!=', 'unallocated')->whereNotExists(fn ($q) => $q->selectRaw('1')->from('student_payment_allocations as aa')->whereColumn('aa.student_payment_id', 'lp.id'))
            ->leftJoinSub($refunded, 'rf', 'rf.student_payment_id', '=', 'lp.id')->selectRaw('lp.academic_enrollment_id, lp.kind, SUM(lp.amount_cents - COALESCE(rf.refunded,0)) AS legacy_paid')->groupBy('lp.academic_enrollment_id', 'lp.kind');
        $grammar = DB::connection()->getQueryGrammar();
        $cast = DB::getDriverName() === 'mysql' ? 'SIGNED' : 'BIGINT';
        $sum = [];
        $late = [];
        for ($i = 0; $i < 24; $i++) {
            $amount = 'COALESCE(CAST('.$grammar->wrap('fa.schedule->['.$i.']->amount_cents').' AS '.$cast.'),0)';
            $sum[] = $amount;
            $late[] = 'CASE WHEN '.$grammar->wrap('fa.schedule->['.$i.']->due_at').' < ? THEN '.$amount.' ELSE 0 END';
        }
        $plans = $active(DB::table('student_financial_adjustments as fa'), 'fa')->where('fa.type', 'plan')
            ->whereNotExists(function ($q) use ($active) {
                $q->selectRaw('1')->from('student_financial_adjustments as fb')->where('fb.type', 'plan')->whereColumn('fb.academic_enrollment_id', 'fa.academic_enrollment_id')->whereColumn('fb.fee_kind', 'fa.fee_kind')->whereColumn('fb.id', '>', 'fa.id');
                $active($q, 'fb');
            })
            ->select('fa.academic_enrollment_id', 'fa.fee_kind')->selectRaw('('.implode('+', $sum).') AS plan_total, ('.implode('+', $late).') AS plan_overdue', array_fill(0, 24, $today));
        $facts = DB::query()->fromSub($bills, 'b')->leftJoinSub($waivers, 'w', fn ($j) => $j->on('w.academic_enrollment_id', '=', 'b.academic_enrollment_id')->on('w.fee_kind', '=', 'b.kind'))
            ->leftJoinSub($legacy, 'l', fn ($j) => $j->on('l.academic_enrollment_id', '=', 'b.academic_enrollment_id')->on('l.kind', '=', 'b.kind'))
            ->leftJoinSub($plans, 'pl', fn ($j) => $j->on('pl.academic_enrollment_id', '=', 'b.academic_enrollment_id')->on('pl.fee_kind', '=', 'b.kind'))
            ->selectRaw('b.*, COALESCE(l.legacy_paid,0) AS legacy_paid, CASE WHEN w.exempted=1 THEN b.total_cents WHEN COALESCE(w.waived,0)>b.total_cents THEN b.total_cents ELSE COALESCE(w.waived,0) END AS waived_cents, pl.plan_total, pl.plan_overdue');
        $due = '(total_cents - waived_cents)';
        $paid = '(legacy_paid + explicit_paid)';
        $overdue = "CASE WHEN plan_total = $due THEN plan_overdue - $paid ELSE overdue_gross - waived_cents - legacy_paid END";

        return DB::query()->fromSub($facts, 'f')->selectRaw("f.currency, SUM(total_cents) AS billed_cents, SUM(waived_cents) AS waived_cents, SUM($due) AS due_cents, SUM(CASE WHEN $paid <= 0 THEN 0 WHEN $paid >= $due THEN $due ELSE $paid END) AS covered_cents, SUM(CASE WHEN $due>$paid THEN $due-$paid ELSE 0 END) AS balance_cents, SUM(CASE WHEN ($overdue)>0 THEN ($overdue) ELSE 0 END) AS overdue_cents");
    }
}
