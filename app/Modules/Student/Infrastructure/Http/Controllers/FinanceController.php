<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicYear;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\FinanceTariff;
use App\Models\Student\PaymentRefund;
use App\Models\Student\StudentPayment;
use App\Modules\Student\Application\Services\AcademicEnrollmentReadService;
use App\Modules\Student\Application\Services\AcademicEnrollmentService;
use App\Modules\Student\Application\Services\FeeTariffService;
use App\Modules\Student\Application\Services\FinanceReconciliationService;
use App\Modules\Student\Application\Services\FinanceReportingService;
use App\Modules\Student\Application\Services\PaymentAllocationService;
use App\Modules\Student\Application\Services\PaymentRefundService;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Modules\Student\Infrastructure\Exports\FinanceWorkbook;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

final class FinanceController extends Controller
{
    private function staff(Request $r): void
    {
        abort_unless($r->user()->hasRole('admin') && $r->user()->can('manage academic finance'), 403);
    }

    private function filters(Request $r): array
    {
        return $r->validate(['q' => 'nullable|string|max:150', 'year' => 'nullable|integer|exists:academic_years,id', 'faculty' => 'nullable|integer|exists:faculties,id', 'program' => 'nullable|integer|exists:academic_programs,id', 'level' => 'nullable|integer|exists:levels,id', 'academic' => 'nullable|integer']);
    }

    public function index(Request $r, StudentFinanceService $finance, FinanceReportingService $reports, AcademicEnrollmentReadService $read)
    {
        $this->staff($r);
        $actor = $r->user();
        $facultyScope = $actor->academicFaculties();
        $hasFacultyScope = $facultyScope->exists();
        $filters = $this->filters($r);
        $entry = isset($filters['academic']) ? AcademicEnrollment::with(['profile.user', 'level.faculty', 'academicYear', 'curriculumVersion', 'promotion.program', 'admissionCohort.program', 'group.intake', 'group.promotion'])->findOrFail($filters['academic']) : null;
        if ($entry) {
            $finance->authorize($entry, $actor);
        }
        $tariffs = FinanceTariff::query();
        if ($hasFacultyScope) {
            $tariffs->where(fn ($q) => $q->whereHas('level', fn ($l) => $l->whereIn('faculty_id', (clone $facultyScope)->select('faculties.id')))->orWhereHas('program', fn ($p) => $p->whereIn('faculty_id', (clone $facultyScope)->select('faculties.id'))));
        }

        return Inertia::render('dashboard/finance/Index', [
            'entries' => $reports->entries($actor, $filters)->latest('academic_enrollments.id')->paginate(15)->withQueryString()->through(fn ($e) => $read->row($e)),
            'filters' => $filters, 'totals' => $reports->totals($actor, $filters), 'selected' => $entry ? $read->row($entry) : null,
            'cashflow' => fn () => $reports->cashflow($actor, $filters),
            'breakdowns' => fn () => $reports->breakdowns($actor, $filters),
            'statement' => $entry ? $finance->statement($entry) : null,
            'adjustments' => $entry ? $entry->adjustments()->latest('id')->paginate(15, ['*'], 'adjustments_page')->withQueryString() : null,
            'obligations' => $entry ? $entry->obligations()->orderBy('installment')->get() : [],
            'payments' => $entry ? $entry->payments()->with('allocations')->latest('id')->paginate(20, ['*'], 'payments_page')->withQueryString() : null,
            'refunds' => $entry ? PaymentRefund::whereIn('student_payment_id', $entry->payments()->select('id'))->latest('id')->paginate(15, ['*'], 'refunds_page')->withQueryString() : null,
            'tariffs' => $tariffs->latest('id')->paginate(15, ['*'], 'tariffs_page')->withQueryString(),
            'faculties' => $hasFacultyScope ? (clone $facultyScope)->orderBy('name')->get(['faculties.id', 'faculties.name'])->makeHidden('pivot') : Faculty::orderBy('name')->get(['id', 'name']),
            'programs' => AcademicProgram::when($hasFacultyScope, fn ($q) => $q->whereIn('faculty_id', (clone $facultyScope)->select('faculties.id')))->orderBy('name')->get(['id', 'name', 'faculty_id']),
            'levels' => Level::with('faculty:id,name')->when($hasFacultyScope, fn ($q) => $q->whereIn('faculty_id', (clone $facultyScope)->select('faculties.id')))->orderBy('title')->get(['id', 'title', 'faculty_id']),
            'cycles' => AcademicCycle::orderBy('name')->get(['id', 'name']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'currencies' => config('finance.currencies'), 'methods' => config('finance.methods'), 'dualControl' => config('finance.dual_control'),
            'preview' => ($r->session()->get('finance.preview.actor_id') === $r->user()->id && $r->session()->get('finance.preview.expires_at', 0) >= now()->timestamp) ? $r->session()->get('finance.preview') : null,
        ]);
    }

    public function confirmations(Request $request, AcademicEnrollmentReadService $read, StudentFinanceService $finance)
    {
        $this->staff($request);
        $filters = $request->validate(['q' => 'nullable|string|max:150']);
        $actor = $request->user();
        $requiresPayment = config('student.enrollment_requires_first_installment');

        return Inertia::render('dashboard/finance/Confirmations', [
            'filters' => $filters,
            'requiresPayment' => $requiresPayment,
            'entries' => $read->query($actor, $filters + ['status' => 'pending_confirmation'])
                ->with('application')->latest('academic_enrollments.id')->paginate(15)->withQueryString()
                ->through(function (AcademicEnrollment $entry) use ($read, $finance, $requiresPayment, $actor) {
                    $blocker = match (true) {
                        $entry->application?->status?->value !== 'validated' => 'Candidature à valider',
                        $entry->profile->student_status !== 'active' => 'Profil étudiant inactif',
                        $entry->academicYear->status !== 'open' => 'Année académique fermée',
                        $requiresPayment && ! $finance->firstTuitionInstallmentCovered($entry) => 'Première tranche à couvrir',
                        default => null,
                    };

                    return $read->row($entry) + [
                        'blocker' => $blocker,
                        'canConfirm' => $actor->can('manage', $entry),
                        'context' => AcademicEnrollmentService::contextToken($entry),
                    ];
                }),
        ]);
    }

    public function confirmEnrollment(Request $request, AcademicEnrollment $academic, AcademicEnrollmentService $service)
    {
        $this->staff($request);
        abort_unless($request->user()->can('manage', $academic), 403);
        try {
            $data = $request->validate([
                'operation_key' => 'required|uuid',
                'expected_context' => 'required|string|size:64',
                'reason' => 'required|string|min:10|max:1000',
            ]);
            $service->transition($academic, $request->user(), $data + [
                'expected_status' => 'pending_confirmation',
                'enrollment_status' => 'confirmed',
            ]);
        } catch (ValidationException $exception) {
            return to_route('dashboard.admin.finance.confirmations', status: 303)->withErrors($exception->errors());
        }

        return to_route('dashboard.admin.finance.confirmations', status: 303)->with('success', 'Inscription académique confirmée.');
    }

    public function tariff(Request $r, FeeTariffService $service)
    {
        $this->staff($r);
        $data = $r->validate(['academic_year_id' => 'required|integer|exists:academic_years,id', 'academic_program_id' => 'nullable|integer|exists:academic_programs,id', 'academic_cycle_id' => 'nullable|integer|exists:academic_cycles,id', 'level_id' => 'nullable|integer|exists:levels,id', 'category' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'kind' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'title' => 'required|string|max:180', 'currency' => 'required|string|size:3', 'valid_from' => 'required|date_format:Y-m-d', 'valid_until' => 'nullable|date_format:Y-m-d|after_or_equal:valid_from', 'schedule' => 'required|array|min:1|max:24', 'schedule.*.amount' => 'required', 'schedule.*.due_at' => 'required|date_format:Y-m-d', 'reason' => 'required|string|min:10|max:2000']);
        $service->create($r->user(), $data);

        return back(303)->with('success', 'Version de barème créée en brouillon.');
    }

    public function activate(Request $r, FinanceTariff $tariff, FeeTariffService $service)
    {
        $this->staff($r);
        $d = $r->validate(['reason' => 'required|string|min:10|max:2000', 'replace_id' => 'nullable|integer']);
        $service->activate($tariff, $r->user(), $d['reason'], $d['replace_id'] ?? null);

        return back(303);
    }

    public function bill(Request $r, AcademicEnrollment $academic, FeeTariffService $service)
    {
        $this->staff($r);
        $d = $r->validate(['tariff_id' => 'required|integer|exists:finance_tariffs,id', 'reason' => 'required|string|min:10|max:2000']);
        $service->bill(FinanceTariff::findOrFail($d['tariff_id']), $academic, $r->user(), $d['reason']);

        return back(303);
    }

    public function allocate(Request $r, StudentPayment $payment, PaymentAllocationService $service)
    {
        $this->staff($r);
        $d = $r->validate(['allocations' => 'required|array|min:1|max:24', 'allocations.*.obligation_id' => 'required|integer|distinct|exists:student_obligations,id', 'allocations.*.amount' => 'required', 'reason' => 'required|string|min:10|max:2000']);
        $service->allocate($payment, $r->user(), $d['allocations'], $d['reason']);

        return back(303);
    }

    public function refund(Request $r, StudentPayment $payment, PaymentRefundService $service)
    {
        $this->staff($r);
        $d = $r->validate(['amount' => 'required', 'operation_key' => 'required|uuid', 'reason' => 'required|string|min:10|max:2000']);
        $service->request($payment, $r->user(), $d);

        return back(303);
    }

    public function refundStatus(Request $r, PaymentRefund $refund, PaymentRefundService $service)
    {
        $this->staff($r);
        $d = $r->validate(['status' => 'required|in:approved,cancelled,executed', 'reason' => 'required|string|min:10|max:2000', 'method' => 'required_if:status,executed|nullable|string', 'execution_reference' => 'required_if:status,executed|nullable|string|max:180']);
        $service->transition($refund, $r->user(), $d);

        return back(303);
    }

    public function preview(Request $r, FinanceReconciliationService $service)
    {
        $this->staff($r);
        $d = $r->validate(['file' => 'required|file|max:2048', 'account' => 'required|string|max:100']);
        $rows = $service->preview($r->user(), $r->file('file')->get());
        $r->session()->put('finance.preview', ['actor_id' => $r->user()->id, 'rows' => $rows, 'account' => $d['account'], 'expires_at' => now()->addMinutes(30)->timestamp]);

        return back(303);
    }

    public function reconcile(Request $r, FinanceReconciliationService $service)
    {
        $this->staff($r);
        $d = $r->validate(['rows' => 'required|array|min:1|max:500', 'rows.*' => 'required|integer|distinct|min:0', 'reason' => 'required|string|min:10|max:2000']);
        $preview = $r->session()->get('finance.preview');
        abort_unless($preview && $preview['actor_id'] === $r->user()->id && $preview['expires_at'] >= now()->timestamp, 422, 'La prévisualisation a expiré.');
        $rows = array_map(function ($index) use ($preview) {
            abort_unless(isset($preview['rows'][$index]), 422);

            return $preview['rows'][$index];
        }, $d['rows']);
        $service->commit($r->user(), $preview['account'], $rows, $d['reason']);
        $r->session()->forget('finance.preview');

        return back(303);
    }

    public function export(Request $r, FinanceReportingService $reports)
    {
        $this->staff($r);
        $filters = $this->filters($r);
        $actor = $r->user();

        return response()->streamDownload(function () use ($reports, $filters, $actor) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['currency', 'billed_minor_units', 'confirmed_gross_minor_units', 'refunds_executed_minor_units', 'net_received_minor_units', 'pending_minor_units', 'cancelled_minor_units', 'legacy_reversals_minor_units', 'waived_minor_units', 'net_due_minor_units', 'balance_minor_units', 'overdue_minor_units'], ',', '"', '');
            foreach ($reports->totals($actor, $filters) as $row) {
                fputcsv($out, [$row['currency'], $row['billed_cents'], $row['gross_cents'], $row['refunded_cents'], $row['net_cents'], $row['pending_cents'], $row['cancelled_cents'], $row['legacy_reversal_cents'], $row['waived_cents'], $row['due_cents'], $row['balance_cents'], $row['overdue_cents']], ',', '"', '');
            } fclose($out);
        }, 'finance-totals.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'private, no-store']);
    }

    public function exportXlsx(Request $r, FinanceWorkbook $workbook)
    {
        $this->staff($r);

        return response($workbook->contents($r->user(), $this->filters($r)), 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="finances-usk.xlsx"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function receipt(Request $r, StudentPayment $payment, StudentFinanceService $finance)
    {
        $this->staff($r);
        $finance->authorize($payment->enrollment, $r->user());
        abort_unless($payment->confirmed_at, 404);

        return response()->view('student.receipt', ['payment' => $payment, 'academic' => $payment->enrollment])->header('Cache-Control', 'private, no-store');
    }

    public function verify(Request $r, StudentPayment $payment)
    {
        abort_unless($payment->confirmed_at, 404);

        return response()->json(['receipt' => $payment->uuid, 'state' => $payment->status === 'confirmed' ? ($payment->refunds()->where('status', 'executed')->exists() ? 'partially_refunded' : 'valid') : 'invalid', 'issued_at' => $payment->confirmed_at->toDateString()])->header('Cache-Control', 'no-store');
    }
}
