<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\LevelDetail;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentObligation;
use App\Models\Student\StudentPayment;
use App\Models\User;
use App\Modules\Student\Application\Services\FeeTariffService;
use App\Modules\Student\Application\Services\FinanceMutation;
use App\Modules\Student\Application\Services\FinanceReconciliationService;
use App\Modules\Student\Application\Services\FinanceReportingService;
use App\Modules\Student\Application\Services\Money;
use App\Modules\Student\Application\Services\PaymentAllocationService;
use App\Modules\Student\Application\Services\PaymentRefundService;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Notifications\FinancialOperationNotice;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class UniversityFinanceTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private function context(): array
    {
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->firstOrFail();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));

        return [$admin, $student, $entry, app(StudentFinanceService::class)];
    }

    private function obligation(AcademicEnrollment $entry, string $kind = 'tuition', int $amount = 10000, ?string $due = null): StudentObligation
    {
        return $entry->obligations()->create(['kind' => $kind, 'title' => 'Frais '.$kind, 'installment' => 1, 'amount_cents' => $amount, 'currency' => $entry->currency, 'due_at' => $due]);
    }

    private function pay(AcademicEnrollment $entry, User $admin, string $amount, string $kind = 'tuition'): StudentPayment
    {
        $service = app(StudentFinanceService::class);
        $payment = $service->record($entry, $admin, ['amount' => $amount, 'kind' => $kind, 'method' => 'bank_transfer', 'reference' => 'PAY-'.Str::uuid(), 'note' => 'Pièce de versement contrôlée.']);
        $service->transition($payment, $admin, 'confirmed', 'Versement vérifié par le service financier.');

        return $payment->fresh();
    }

    private function invalid(callable $action, string $field): void
    {
        try {
            $action();
            $this->fail('Expected financial validation.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey($field, $e->errors());
        }
    }

    public function test_money_is_exact_and_binary_floats_and_excess_precision_are_refused(): void
    {
        $this->assertSame(1, Money::cents('0.01'));
        $this->assertSame(101, Money::cents('1.01'));
        $this->assertSame('999999999.99', Money::decimal(Money::cents('999999999.99')));
        foreach (['-1', '1.001', '1e3', 0.1 + 0.2] as $bad) {
            $this->invalid(fn () => Money::cents($bad), 'amount');
        }
    }

    public function test_legacy_billing_is_idempotent_nonretroactive_and_obligations_are_immutable(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $detail = LevelDetail::create(['level_id' => $entry->level_id, 'price_national_first' => '10.10', 'price_national_second' => '20.20']);
        $finance->assess($entry, $admin, 'national', [], 'Barème initial validé et affecté.');
        $detail->update(['price_national_first' => '99.99']);
        $finance->assess($entry, $admin, 'national', [], 'Réexécution du même contexte tarifaire.');
        $this->assertSame(3030, $finance->balance($entry)['total_cents']);
        $this->assertDatabaseCount('student_obligations', 2);
        $obligation = $entry->obligations()->firstOrFail();
        $this->assertSame('10.10', $obligation->source_snapshot['amount']);
        $this->invalid(fn () => $obligation->update(['amount_cents' => 99999]), 'obligation');
    }

    public function test_payment_reference_replay_and_validated_payment_immutability(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $this->obligation($entry);
        $data = ['amount' => '25.35', 'method' => 'cash', 'reference' => 'SAME-REFERENCE', 'note' => 'Justification de caisse contrôlée.'];
        $p = $finance->record($entry, $admin, $data);
        $again = $finance->record($entry, $admin, $data);
        $this->assertSame($p->id, $again->id);
        $this->invalid(fn () => $finance->record($entry, $admin, array_replace($data, ['amount' => '30.00'])), 'reference');
        $finance->transition($p, $admin, 'confirmed', 'Contrôle documentaire réalisé.');
        $finance->transition($p, $admin, 'confirmed', 'Rejeu de confirmation sans nouvelle écriture.');
        $this->invalid(fn () => $p->fresh()->update(['amount_cents' => 1]), 'payment');
        $this->invalid(fn () => FinanceMutation::run(fn () => $p->fresh()->update(['amount_cents' => 1])), 'payment');
        $this->invalid(fn () => $p->fresh()->delete(), 'payment');
        $this->assertDatabaseCount('student_payments', 1);
        $this->assertSame(2535, $finance->balance($entry)['paid_cents']);
    }

    public function test_a_payment_can_cover_multiple_obligations_without_duplicate_allocations(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $tuition = $this->obligation($entry, 'tuition', 10000, today()->subDay()->toDateString());
        $lab = $this->obligation($entry, 'lab', 5000, today()->addMonth()->toDateString());
        $p = $this->pay($entry, $admin, '120.00', 'unallocated');
        $this->assertSame(15000, $finance->balance($entry)['balance_cents']);
        $this->assertSame(12000, $finance->balance($entry)['unallocated_cents']);
        $rows = [['obligation_id' => $tuition->id, 'amount' => '100.00'], ['obligation_id' => $lab->id, 'amount' => '20.00']];
        $service = app(PaymentAllocationService::class);
        $service->allocate($p, $admin, $rows, 'Affectation contrôlée aux deux frais.');
        $service->allocate($p, $admin, $rows, 'Rejeu des affectations déjà publiées.');
        $balance = $finance->balance($entry);
        $this->assertSame(3000, $balance['balance_cents']);
        $this->assertSame(0, $balance['overdue_cents']);
        $this->assertSame(0, $balance['unallocated_cents']);
        $this->assertDatabaseCount('student_payment_allocations', 2);
        $report = app(FinanceReportingService::class)->totals($admin, [])[0];
        $this->assertSame($balance['balance_cents'], $report['balance_cents']);
        $this->assertSame($balance['overdue_cents'], $report['overdue_cents']);
    }

    public function test_allocations_cannot_cross_student_context_currency_or_available_amount(): void
    {
        [$admin,,$entry] = $this->context();
        $o = $this->obligation($entry);
        $other = $entry->replicate();
        $other->academic_year_id = AcademicYear::create(['title' => 'Autre', 'start_date' => '2028-10-01', 'end_date' => '2029-09-30', 'status' => 'draft'])->id;
        $other->save();
        $foreign = $this->obligation($other, 'lab');
        $p = $this->pay($entry, $admin, '50.00', 'unallocated');
        $service = app(PaymentAllocationService::class);
        $this->invalid(fn () => $service->allocate($p, $admin, [['obligation_id' => $o->id, 'amount' => '60.00']], 'Montant soumis au contrôle.'), 'allocations');
        try {
            $service->allocate($p, $admin, [['obligation_id' => $o->id, 'amount' => '10.00'], ['obligation_id' => $foreign->id, 'amount' => '10.00']], 'Tentative de mélange de contextes.');
            $this->fail('Foreign obligation must be refused.');
        } catch (ModelNotFoundException) {
            $this->assertDatabaseCount('student_payment_allocations', 0);
        }
    }

    public function test_refunds_require_authorization_and_executed_reference_and_are_bounded_and_idempotent(): void
    {
        [$admin,$student,$entry,$finance] = $this->context();
        $this->obligation($entry);
        $p = $this->pay($entry, $admin, '100.00');
        $service = app(PaymentRefundService::class);
        $data = ['amount' => '30.00', 'operation_key' => (string) Str::uuid(), 'reason' => 'Demande de remboursement partiel.'];
        $refund = $service->request($p, $admin, $data);
        $this->assertSame(10000, $finance->balance($entry)['paid_cents']);
        $this->invalid(fn () => $service->transition($refund, $admin, ['status' => 'executed', 'reason' => 'Exécution sans autorisation préalable.', 'method' => 'cash', 'execution_reference' => 'NO-AUTH']), 'refund');
        $service->transition($refund, $admin, ['status' => 'approved', 'reason' => 'Autorisation vérifiée et motivée.']);
        $this->assertSame(10000, $finance->balance($entry)['paid_cents']);
        $execute = ['status' => 'executed', 'method' => 'bank_transfer', 'execution_reference' => 'OUT-001', 'reason' => 'Décaissement réellement contrôlé.'];
        $service->transition($refund, $admin, $execute);
        $service->transition($refund, $admin, $execute);
        $this->assertSame($refund->id, $service->request($p, $admin, $data)->id);
        $this->assertSame(7000, $finance->balance($entry)['paid_cents']);
        $this->assertSame(3000, $finance->balance($entry)['balance_cents']);
        $this->assertSame('confirmed', $p->fresh()->status);
        $this->actingAs($student)->get('/dashboard/student/transactions?academic='.$entry->id)->assertInertia(fn (Assert $page) => $page->where('payments.0.refunded_cents', 3000)->where('payments.0.currency', 'USD'));
        $this->get(URL::signedRoute('finance.receipts.verify', ['payment' => $p->uuid]))->assertJson(['state' => 'partially_refunded']);
        $this->invalid(fn () => $service->request($p, $admin, ['amount' => '80.00', 'operation_key' => (string) Str::uuid(), 'reason' => 'Dépassement du montant remboursable.']), 'amount');
        $this->invalid(fn () => $finance->transition($p, $admin, 'cancelled', 'Annulation incompatible avec remboursement.'), 'payment');
        $remaining = $service->request($p, $admin, ['amount' => '70.00', 'operation_key' => (string) Str::uuid(), 'reason' => 'Solde du remboursement autorisé.']);
        $service->transition($remaining, $admin, ['status' => 'approved', 'reason' => 'Autorisation du solde du remboursement.']);
        $service->transition($remaining, $admin, array_replace($execute, ['execution_reference' => 'OUT-002']));
        $this->assertSame('refunded', $p->fresh()->status);
        $this->assertSame(10000, $finance->balance($entry)['refunded_cents']);
        $this->assertSame(0, $finance->balance($entry)['paid_cents']);
        $this->assertSame(10000, (int) $p->fresh()->amount_cents);
    }

    public function test_partial_refund_reverses_explicit_allocations_without_deleting_them(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $o = $this->obligation($entry);
        $p = $this->pay($entry, $admin, '100.00', 'unallocated');
        app(PaymentAllocationService::class)->allocate($p, $admin, [['obligation_id' => $o->id, 'amount' => '100.00']], 'Affectation initiale des fonds.');
        $service = app(PaymentRefundService::class);
        $refund = $service->request($p, $admin, ['amount' => '20.00', 'operation_key' => (string) Str::uuid(), 'reason' => 'Retour partiel des fonds autorisé.']);
        $service->transition($refund, $admin, ['status' => 'approved', 'reason' => 'Autorisation du retour partiel.']);
        $service->transition($refund, $admin, ['status' => 'executed', 'method' => 'cash', 'execution_reference' => 'CASH-OUT', 'reason' => 'Sortie de caisse attestée.']);
        $this->assertSame(8000, $finance->balance($entry, 'tuition')['paid_cents']);
        $this->assertSame(2000, $finance->balance($entry)['balance_cents']);
        $this->assertDatabaseCount('student_payment_allocations', 1);
        $this->assertDatabaseCount('student_refund_allocations', 1);
        $this->assertSame(2000, app(FinanceReportingService::class)->totals($admin, [])[0]['balance_cents']);
    }

    public function test_approved_plan_changes_overdue_amount_without_erasing_payments_and_replacement_is_historical(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $this->obligation($entry, 'tuition', 10000, today()->subDays(10)->toDateString());
        $this->pay($entry, $admin, '20.00');
        $this->assertSame(8000, $finance->balance($entry)['overdue_cents']);
        $data = ['type' => 'plan', 'reason' => 'Moratoire autorisé et documenté.', 'schedule' => [['amount' => '60.00', 'due_at' => today()->addMonth()->toDateString()], ['amount' => '40.00', 'due_at' => today()->addMonths(2)->toDateString()]]];
        $first = $finance->adjust($entry, $admin, $data);
        $this->assertSame(0, $finance->balance($entry)['overdue_cents']);
        $this->invalid(fn () => $finance->adjust($entry, $admin, ['type' => 'scholarship', 'amount' => '10.00', 'reason' => 'Aide qui nécessite un réaménagement.']), 'adjustment');
        $finance->adjust($entry, $admin, array_replace($data, ['schedule' => [['amount' => '100.00', 'due_at' => today()->addMonths(3)->toDateString()]]]));
        $this->assertFalse($first->fresh()->is_active);
        $this->assertDatabaseCount('student_payments', 1);
        $this->assertSame(0, app(FinanceReportingService::class)->totals($admin, [])[0]['overdue_cents']);
    }

    public function test_percentage_aids_use_integer_rounding_and_third_party_pledges_are_not_discounts(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $this->obligation($entry, 'tuition', 101);
        $grant = $finance->adjust($entry, $admin, ['type' => 'scholarship', 'percentage' => '50', 'reason' => 'Bourse institutionnelle à cinquante pour cent.', 'operation_key' => (string) Str::uuid()]);
        $this->assertSame(51, (int) $grant->amount_cents);
        $this->assertSame(50, $finance->balance($entry)['due_cents']);
        $finance->adjust($entry, $admin, ['type' => 'scholarship', 'amount' => '0.50', 'funding_source' => 'third_party', 'reason' => 'Prise en charge attendue d’un tiers.']);
        $this->assertSame(50, $finance->balance($entry)['due_cents']);
        $this->invalid(fn () => $finance->adjust($entry, $admin, ['type' => 'exemption', 'reason' => 'Exonération incompatible avec bourse existante.']), 'adjustment');
    }

    public function test_versioned_tariffs_are_scoped_and_replace_explicitly_without_rebilling(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $service = app(FeeTariffService::class);
        $data = ['academic_year_id' => $entry->academic_year_id, 'level_id' => $entry->level_id, 'category' => 'national', 'kind' => 'tuition', 'title' => 'Tarif versionné', 'currency' => 'USD', 'valid_from' => today()->toDateString(), 'valid_until' => null, 'reason' => 'Version du barème validée par la finance.', 'schedule' => [['amount' => '25.50', 'due_at' => today()->addWeek()->toDateString()]]];
        $v1 = $service->create($admin, $data);
        $service->activate($v1, $admin, 'Activation du premier barème.');
        $service->bill($v1, $entry, $admin, 'Émission des frais validés.');
        $service->bill($v1, $entry, $admin, 'Rejeu de facturation déjà émise.');
        $v2 = $service->create($admin, array_replace($data, ['schedule' => [['amount' => '50.00', 'due_at' => today()->addWeek()->toDateString()]]]));
        $this->invalid(fn () => $service->activate($v2, $admin, 'Activation sans remplacement explicite.'), 'replace_id');
        $service->activate($v2, $admin, 'Remplacement explicite de la version active.', $v1->id);
        $this->invalid(fn () => $service->bill($v2, $entry, $admin, 'Tentative de refacturation rétroactive.'), 'tariff');
        $this->assertSame(2550, $finance->balance($entry)['total_cents']);
        $this->assertDatabaseCount('student_obligations', 1);
        $this->assertSame($v1->id, $entry->obligations()->sole()->finance_tariff_id);
    }

    public function test_csv_reconciliation_requires_exact_match_and_explicit_commit(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $this->obligation($entry);
        $p = $finance->record($entry, $admin, ['amount' => '30.00', 'method' => 'bank_transfer', 'reference' => 'BANK-REF', 'note' => 'Versement à rapprocher.']);
        $service = app(FinanceReconciliationService::class);
        $csv = "bank_reference,payment_reference,amount,currency,date\nOP1,BANK-REF,30.00,USD,".today()->toDateString()."\nOP2,BANK-REF,31.00,USD,".today()->toDateString()."\nOP1,BANK-REF,30.00,USD,".today()->toDateString()."\n";
        $rows = $service->preview($admin, $csv);
        $this->assertSame(['match', 'mismatch', 'duplicate'], array_column($rows, 'state'));
        $this->assertSame('pending', $p->fresh()->status);
        $service->commit($admin, 'BANK-ACCOUNT', [$rows[0]], 'Rapprochement explicite après contrôle du relevé.');
        $service->commit($admin, 'BANK-ACCOUNT', [$rows[0]], 'Rejeu du rapprochement de la même opération.');
        $this->assertSame('confirmed', $p->fresh()->status);
        $this->assertDatabaseCount('finance_bank_lines', 1);
        $this->invalid(fn () => $service->commit($admin, 'BANK-ACCOUNT', [$rows[1]], 'Une ressemblance ne vaut pas rapprochement.'), 'rows');
    }

    public function test_receipt_snapshot_verification_and_ownership_are_safe(): void
    {
        [$admin,$student,$entry] = $this->context();
        $this->obligation($entry);
        $p = $this->pay($entry, $admin, '100.00');
        $snapshot = $p->receipt_snapshot;
        $student->update(['first_name' => 'Nom ultérieurement corrigé']);
        $this->actingAs($student)->get('/dashboard/student/payments/'.$p->uuid.'/receipt')->assertOk()->assertSee($snapshot['name'])->assertDontSee('Nom ultérieurement corrigé');
        $url = URL::signedRoute('finance.receipts.verify', ['payment' => $p->uuid]);
        $this->get($url)->assertOk()->assertJson(['state' => 'valid'])->assertJsonMissingPath('amount_cents')->assertJsonMissingPath('name')->assertJsonMissingPath('email');
        $this->get('/finance/receipts/'.$p->uuid.'/verify')->assertForbidden();
        $other = User::factory()->create();
        $other->assignRole('student');
        $this->actingAs($other)->get('/dashboard/student/payments/'.$p->uuid.'/receipt')->assertForbidden();
    }

    public function test_finance_dashboard_export_and_mutations_enforce_roles_and_faculty_scope(): void
    {
        [$admin,$student,$entry] = $this->context();
        $this->obligation($entry);
        $this->actingAs($student)->get('/dashboard/admin/finance')->assertForbidden();
        $this->post('/dashboard/admin/student-academic/'.$entry->id.'/payments', ['amount' => '1.00', 'kind' => 'tuition', 'method' => 'cash', 'reference' => 'HACK', 'note' => 'Tentative cliente interdite.'])->assertForbidden();
        $account = route('dashboard.admin.finance.index', ['academic' => $entry->id]);
        $this->actingAs($admin)->get($account)->assertInertia(fn (Assert $p) => $p->component('dashboard/finance/Index')->where('statement.balance.balance_cents', 10000)->where('totals.0.balance_cents', 10000));
        $this->get('/dashboard/admin/finance/export')->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->assertSessionHas('_previous.url', $account);
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Autre faculté', 'code' => 'OTHER']);
        $admin->academicFaculties()->attach($faculty);
        $this->get('/dashboard/admin/finance')->assertInertia(fn (Assert $p) => $p->has('entries.data', 0)->has('totals', 0));
        $this->get('/dashboard/admin/finance?academic='.$entry->id)->assertForbidden();
    }

    public function test_two_currencies_are_never_aggregated_and_checker_can_be_required(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $this->obligation($entry);
        $p = $finance->record($entry, $admin, ['amount' => '10.00', 'method' => 'cash', 'reference' => 'DUAL', 'note' => 'Saisie par le premier agent.']);
        config(['finance.dual_control' => true]);
        $this->invalid(fn () => $finance->transition($p, $admin, 'confirmed', 'Auto-confirmation interdite en double contrôle.'), 'payment');
        $checker = User::factory()->create();
        $checker->assignRole('admin');
        $finance->transition($p, $checker, 'confirmed', 'Vérification par un autre agent.');
        $other = $entry->replicate();
        $other->academic_year_id = AcademicYear::create(['title' => '2027-2028', 'start_date' => '2027-10-01', 'end_date' => '2028-09-30', 'status' => 'draft'])->id;
        $other->currency = 'CDF';
        $other->save();
        $this->obligation($other, 'tuition', 100000);
        $totals = collect(app(FinanceReportingService::class)->totals($admin, []))->keyBy('currency');
        $this->assertCount(2, $totals);
        $this->assertSame(10000, $totals['USD']['billed_cents']);
        $this->assertSame(100000, $totals['CDF']['billed_cents']);
    }

    public function test_finance_cashflow_groups_dated_receipts_and_refunds_by_local_month_and_filtered_currency(): void
    {
        [$admin, , $entry, $finance] = $this->context();
        $this->obligation($entry);
        $this->travelTo(CarbonImmutable::parse('2026-10-31 23:30:00', 'UTC'));
        $payment = $this->pay($entry, $admin, '40.00');
        $cancelled = $this->pay($entry, $admin, '15.00');
        $finance->transition($cancelled, $admin, 'cancelled', 'Contrepassation de l’écriture erronée.');
        $refunds = app(PaymentRefundService::class);
        $refund = $refunds->request($payment, $admin, ['amount' => '40.00', 'operation_key' => (string) Str::uuid(), 'reason' => 'Remboursement intégral de ce versement.']);
        $refunds->transition($refund, $admin, ['status' => 'approved', 'reason' => 'Remboursement autorisé par la caisse.']);
        $this->travelTo(CarbonImmutable::parse('2026-11-30 23:30:00', 'UTC'));
        $refunds->transition($refund, $admin, ['status' => 'executed', 'reason' => 'Décaissement vérifié et rapproché.', 'method' => 'cash', 'execution_reference' => 'CASHFLOW-REFUND']);

        $faculty = DB::table('faculties')->insertGetId(['name' => 'Autre faculté', 'code' => 'OTHER']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Autre niveau', 'code' => 'A1']);
        $other = $entry->replicate();
        $other->academic_year_id = AcademicYear::create(['title' => '2025-2026', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30', 'status' => 'closed'])->id;
        $other->level_id = $level;
        $other->currency = 'CDF';
        $other->save();
        $this->obligation($other, amount: 120000);
        $this->pay($other, $admin, '1000.00');

        $this->actingAs($admin)->get(route('dashboard.admin.finance.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('cashflow.series', 2)
            ->where('cashflow.series.0.currency', 'CDF')
            ->where('cashflow.series.0.months.11.net_cents', 100000)
            ->where('cashflow.series.1.currency', 'USD'));
        $this->get(route('dashboard.admin.finance.index', ['year' => $entry->academic_year_id]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('cashflow.start_month', '2026-01')
            ->where('cashflow.end_month', '2026-12')
            ->has('cashflow.series', 1)
            ->where('cashflow.series.0.currency', 'USD')
            ->has('cashflow.series.0.months', 12)
            ->where('cashflow.series.0.months.9.gross_cents', 0)
            ->where('cashflow.series.0.months.10', ['month' => '2026-11', 'gross_cents' => 4000, 'refunded_cents' => 0, 'net_cents' => 4000])
            ->where('cashflow.series.0.months.11', ['month' => '2026-12', 'gross_cents' => 0, 'refunded_cents' => 4000, 'net_cents' => -4000]));

        $admin->academicFaculties()->attach($entry->level->faculty_id);
        $this->get(route('dashboard.admin.finance.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('faculties', 1)
            ->where('faculties.0.id', $entry->level->faculty_id)
            ->missing('faculties.0.pivot')
            ->has('cashflow.series', 1)
            ->where('cashflow.series.0.currency', 'USD'));
        $this->get(route('dashboard.admin.finance.index', ['faculty' => $faculty]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('cashflow.series', 0));
    }

    public function test_finance_breakdowns_reconcile_fee_and_faculty_totals_with_the_filtered_ledger(): void
    {
        [$admin, , $entry, $finance] = $this->context();
        $yesterday = today('Africa/Kinshasa')->subDay()->toDateString();
        $this->obligation($entry, 'tuition', 10000, $yesterday);
        $this->obligation($entry, 'lab', 2000);
        $this->pay($entry, $admin, '25.00');
        $finance->adjust($entry, $admin, [
            'type' => 'scholarship',
            'fee_kind' => 'tuition',
            'amount' => '10.00',
            'reason' => 'Bourse affectée aux frais de scolarité.',
        ]);

        $faculty = DB::table('faculties')->insertGetId(['name' => 'Faculté des sciences', 'code' => 'SCI']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Sciences', 'code' => 'SCI1']);
        $other = $entry->replicate();
        $other->level_id = $level;
        $other->save();
        $this->obligation($other, 'tuition', 50000, $yesterday);

        $older = $other->replicate();
        $older->academic_year_id = AcademicYear::create(['title' => '2025-2026', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30', 'status' => 'closed'])->id;
        $older->currency = 'CDF';
        $older->save();
        $this->obligation($older, 'tuition', 120000, $yesterday);

        $reports = app(FinanceReportingService::class);
        $breakdowns = $reports->breakdowns($admin, []);
        $this->assertSame(['CDF', 'USD', 'USD'], array_column($breakdowns['faculties'], 'currency'));
        $this->assertSame($faculty, $breakdowns['faculties'][1]['faculty_id']);
        $this->assertSame(50000, $breakdowns['faculties'][1]['balance_cents']);

        foreach ($reports->totals($admin, []) as $total) {
            foreach ($breakdowns as $rows) {
                $matching = collect($rows)->where('currency', $total['currency']);
                foreach (['billed_cents', 'waived_cents', 'due_cents', 'balance_cents', 'overdue_cents'] as $field) {
                    $this->assertSame($total[$field], $matching->sum($field), $field);
                }
                $this->assertSame($total['due_cents'] - $total['balance_cents'], $matching->sum('covered_cents'));
            }
        }

        $this->actingAs($admin)->get(route('dashboard.admin.finance.index', ['year' => $entry->academic_year_id, 'level' => $entry->level_id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('breakdowns.faculties', 1)
            ->where('breakdowns.faculties.0.faculty_id', $entry->level->faculty_id)
            ->where('breakdowns.faculties.0.billed_cents', 12000)
            ->where('breakdowns.faculties.0.balance_cents', 8500)
            ->where('breakdowns.faculties.0.overdue_cents', 6500)
            ->has('breakdowns.fee_kinds', 2)
            ->where('breakdowns.fee_kinds.0.kind', 'tuition')
            ->where('breakdowns.fee_kinds.0.covered_cents', 2500));

        $admin->academicFaculties()->attach($entry->level->faculty_id);
        $this->get(route('dashboard.admin.finance.index', ['faculty' => $faculty]))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('breakdowns.faculties', 0)
                ->has('breakdowns.fee_kinds', 0));
    }

    public function test_payment_notifications_are_private_and_idempotent(): void
    {
        [$admin,$student,$entry,$finance] = $this->context();
        $this->obligation($entry);
        $p = $this->pay($entry, $admin, '10.00');
        $finance->transition($p, $admin, 'confirmed', 'Rejeu de la confirmation déjà enregistrée.');
        $notices = $student->notifications()->where('type', FinancialOperationNotice::class)->get();
        $this->assertCount(1, $notices);
        $this->assertSame($entry->id, $notices->first()->data['academic_enrollment_id']);
        $this->assertArrayNotHasKey('amount_cents', $notices->first()->data);
        $this->assertSame('confirmed', $notices->first()->data['status']);
    }

    public function test_http_csv_preview_is_actor_bound_and_commit_is_explicit(): void
    {
        [$admin,,$entry,$finance] = $this->context();
        $this->obligation($entry);
        $p = $finance->record($entry, $admin, ['amount' => '20.00', 'reference' => 'HTTP-BANK', 'method' => 'bank_transfer', 'note' => 'Versement avec référence bancaire.']);
        $csv = "bank_reference,payment_reference,amount,currency,date\nHTTP-OP,HTTP-BANK,20.00,USD,".today()->toDateString()."\n";
        $this->actingAs($admin)->post('/dashboard/admin/finance/reconciliation/preview', ['file' => UploadedFile::fake()->createWithContent('bank.csv', $csv), 'account' => 'Journal banque'])->assertStatus(303);
        $this->assertSame('pending', $p->fresh()->status);
        $this->assertDatabaseCount('finance_bank_lines', 0);
        $this->post('/dashboard/admin/finance/reconciliation/commit', ['rows' => [0], 'reason' => 'Rapprochement explicitement contrôlé.'])->assertStatus(303);
        $this->assertSame('confirmed', $p->fresh()->status);
        $this->assertDatabaseCount('finance_bank_lines', 1);
        $this->post('/dashboard/admin/finance/reconciliation/commit', ['rows' => [0], 'reason' => 'Prévisualisation déjà consommée.'])->assertStatus(422);
    }

    public function test_refund_records_cannot_be_edited_outside_audited_workflow(): void
    {
        [$admin,,$entry] = $this->context();
        $this->obligation($entry);
        $p = $this->pay($entry, $admin, '100.00');
        $service = app(PaymentRefundService::class);
        $refund = $service->request($p, $admin, ['amount' => '10.00', 'operation_key' => (string) Str::uuid(), 'reason' => 'Demande de remboursement contrôlée.']);
        $this->invalid(fn () => $refund->update(['status' => 'executed']), 'refund');
        $this->invalid(fn () => $refund->delete(), 'refund');
        $this->assertSame('requested', $refund->fresh()->status);
    }
}
