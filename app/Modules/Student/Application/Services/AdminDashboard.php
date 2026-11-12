<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\EnrollmentEvent;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicSession;
use App\Models\Student\StudentPayment;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

final class AdminDashboard
{
    public function __construct(private readonly FinanceReportingService $finance) {}

    public function for(User $actor): array
    {
        $now = CarbonImmutable::now('Africa/Kinshasa');
        $openYears = AcademicYear::where('status', 'open')->orderByDesc('start_date')->orderByDesc('id');
        $year = (clone $openYears)->where('start_date', '<=', $now->toDateString())
            ->where('end_date', '>=', $now->toDateString())->first(['id', 'title'])
            ?? $openYears->first(['id', 'title']);
        $faculties = $actor->academicFaculties()->orderBy('name')->get(['faculties.id', 'faculties.name']);
        $canManageAccess = $actor->can('manage academic access');
        $canManageFinance = $actor->can('manage academic finance');
        $canPublish = $actor->can('publish academic content');
        $yearFilter = $year ? ['year' => $year->id] : [];
        $academic = AcademicStaffScope::apply(AcademicEnrollment::query(), $actor)
            ->when($year, fn ($query) => $query->where('academic_year_id', $year->id));

        $metrics = [];
        $actions = [];
        $shortcuts = [];
        $admissions = null;
        $finance = null;
        $activity = [];
        $schedule = null;

        if ($actor->can('viewAny', StudentProfile::class)) {
            $href = route('dashboard.admin.student-academic.index', $yearFilter, false);
            $metrics[] = $this->metric(
                'students', 'Étudiants confirmés',
                (clone $academic)->where('enrollment_status', 'confirmed')->distinct()->count('student_profile_id'),
                'Étudiants ayant une inscription académique confirmée',
                route('dashboard.admin.student-academic.index', $yearFilter + ['enrollment_status' => 'confirmed'], false),
            );
            $shortcuts[] = $this->shortcut('students', 'Dossiers étudiants', 'Annuaire et suivi des inscriptions', $href);
        }

        if ($canManageAccess) {
            $filters = array_filter([
                'year_id' => $year?->id,
                'faculty_id' => $faculties->count() === 1 ? $faculties->first()->id : null,
            ]);
            $href = route('dashboard.admin.enrollments.index', $filters, false);
            $applications = AcademicStaffScope::apply(Enrollment::query(), $actor)
                ->when($year, fn ($query) => $query->where('academic_year_id', $year->id));
            $statuses = [
                EnrollmentStatus::SUBMITTED->value => 'À analyser',
                EnrollmentStatus::PENDING->value => 'En cours d’examen',
                EnrollmentStatus::VALIDATED->value => 'Validés',
                EnrollmentStatus::REJECTED->value => 'Rejetés',
                EnrollmentStatus::CANCELLED->value => 'Annulés',
            ];
            $counts = (clone $applications)->toBase()
                ->whereIn('status', array_keys($statuses))->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')->pluck('total', 'status');
            $admissions = [];
            foreach ($statuses as $status => $label) {
                $admissions[] = ['label' => $label, 'value' => (int) $counts->get($status, 0)];
            }
            $new = (int) $counts->get(EnrollmentStatus::SUBMITTED->value, 0);
            $review = (int) $counts->get(EnrollmentStatus::PENDING->value, 0);
            $metrics[] = $this->metric('admissions', 'Dossiers d’admission', (int) $counts->sum(), 'Dossiers hors brouillon', $href);
            $actions[] = $this->action(
                'new-applications', 'Nouveaux dossiers', $new, 'Dossiers soumis à prendre en charge',
                route('dashboard.admin.enrollments.index', $filters + ['queue' => 'new'], false),
            );
            $actions[] = $this->action(
                'applications-in-review', 'Dossiers en cours d’examen', $review, 'Analyses, corrections et décisions à suivre',
                route('dashboard.admin.enrollments.index', $filters + ['queue' => 'review'], false),
            );
            $actions[] = $this->action(
                'confirm-enrollments', 'Inscriptions à confirmer',
                (clone $academic)->where('enrollment_status', 'pending_confirmation')->count(),
                'Inscriptions académiques en attente de confirmation',
                route('dashboard.admin.student-academic.administration', $yearFilter + ['status' => 'pending_confirmation'], false),
            );
            $activity = $this->admissionActivity($applications);
            $shortcuts[] = $this->shortcut('admissions', 'Admissions', 'Files de dossiers et décisions', $href);
        }

        if ($canManageFinance) {
            $href = route('dashboard.admin.finance.index', $yearFilter, false);
            $payments = StudentPayment::whereIn('academic_enrollment_id', (clone $academic)->select('id'));
            $confirmed = (clone $payments)->where('status', 'confirmed');
            $metrics[] = $this->metric('payments', 'Paiements confirmés', (clone $confirmed)->count(), 'Opérations confirmées en comptabilité', $href);
            $actions[] = $this->action('confirm-payments', 'Paiements en attente', (clone $payments)->where('status', 'pending')->count(), 'Opérations à suivre dans le module financier', $href);
            $finance = array_map(fn (array $total) => Arr::only($total, ['currency', 'billed_cents', 'net_cents', 'balance_cents']), $this->finance->totals($actor, $yearFilter));
            $activity = [...$activity, ...$this->paymentActivity($confirmed, $yearFilter)];
            $shortcuts[] = $this->shortcut('finance', 'Finances', 'Facturation, encaissements et rapprochements', $href);
        }

        if ($canPublish) {
            $scheduleFilters = $year ? ['academic_year_id' => $year->id] : [];
            $href = route('dashboard.admin.schedule.index', $scheduleFilters, false);
            $offerings = TeachingScope::offerings($actor)->whereNull('archived_at')
                ->when($year, fn ($query) => $query->where('academic_year_id', $year->id));
            $sessions = AcademicSession::whereIn('academic_offering_id', $offerings->select('id'))
                ->whereNull('cancelled_at')->where('starts_at', '>=', $now->utc());
            $published = (clone $sessions)->where('is_published', true)
                ->whereHas('offering', fn ($query) => $query->where('is_published', true));
            $metrics[] = $this->metric(
                'sessions', 'Séances à venir',
                (clone $published)->where('starts_at', '<', $now->addDays(7)->utc())->count(),
                'Séances publiées des 7 prochains jours', $href,
            );
            $actions[] = $this->action(
                'draft-sessions', 'Séances à publier', (clone $sessions)->where('is_published', false)->count(),
                'Séances à venir encore en brouillon ou validées sans publication', $href,
            );
            $schedule = $published->with(['offering.course', 'offering.curriculumItem', 'offering.level', 'registeredRoom'])
                ->orderBy('starts_at')->orderBy('id')->limit(5)->get()
                ->map(fn (AcademicSession $session) => [
                    'label' => $session->offering->curriculumItem?->name ?? $session->offering->course->title,
                    'detail' => implode(' · ', array_filter([$session->offering->level->title, $session->registeredRoom?->name ?? $session->room])),
                    'date' => $session->starts_at->toISOString(),
                    'href' => route('dashboard.admin.schedule.index', [
                        'academic_year_id' => $session->offering->academic_year_id,
                        'week' => $session->starts_at->copy()->timezone('Africa/Kinshasa')->startOfWeek()->toDateString(),
                    ], false),
                ])->all();
            $shortcuts[] = $this->shortcut('schedule', 'Horaires', 'Planification et publication des séances', $href);
        }

        if ($canManageAccess || $canPublish) {
            $shortcuts[] = $this->shortcut('teaching', 'Enseignements', 'Offres de cours et équipes pédagogiques', route('dashboard.admin.teaching.index', $yearFilter, false));
            $shortcuts[] = $this->shortcut('structure', 'Structure académique', 'Facultés, programmes et maquettes', route('dashboard.admin.academic-structure.index', absolute: false));
        }
        $shortcuts[] = $this->shortcut('years', 'Années académiques', 'Ouverture, périodes et clôture des années', route('dashboard.admin.academic-years.index', absolute: false));

        return [
            'year' => $year?->only(['id', 'title']),
            'scope' => ['label' => $faculties->isEmpty() ? 'Périmètre institutionnel' : $faculties->pluck('name')->join(', ')],
            'metrics' => $metrics,
            'actions' => $actions,
            'admissions' => $admissions,
            'finance' => $finance,
            'activity' => collect($activity)->sortByDesc('date')->take(6)->values()->all(),
            'schedule' => $schedule,
            'shortcuts' => $shortcuts,
        ];
    }

    private function admissionActivity(Builder $applications): array
    {
        $labels = [
            'submitted' => 'Dossier soumis',
            'analysis_started' => 'Analyse commencée',
            'analysis_completed' => 'Analyse terminée',
            'corrections_requested' => 'Corrections demandées',
            'validated' => 'Admission validée',
            'rejected' => 'Admission rejetée',
        ];

        return EnrollmentEvent::whereIn('enrollment_id', $applications->select('id'))
            ->whereIn('event', array_keys($labels))->whereNotNull('occurred_at')
            ->with('enrollment:id')->orderByDesc('occurred_at')->orderByDesc('id')->limit(6)->get()
            ->map(fn (EnrollmentEvent $event) => [
                'label' => $labels[$event->event],
                'detail' => $event->enrollment->reference,
                'date' => $event->occurred_at->toISOString(),
                'href' => route('dashboard.admin.enrollments.show', ['id' => $event->enrollment_id], false),
            ])->all();
    }

    private function paymentActivity(Builder $payments, array $yearFilter): array
    {
        return $payments->whereNotNull('confirmed_at')->orderByDesc('confirmed_at')->orderByDesc('id')->limit(6)
            ->get(['id', 'academic_enrollment_id', 'amount_cents', 'currency', 'confirmed_at'])
            ->map(fn (StudentPayment $payment) => [
                'label' => 'Paiement confirmé',
                'detail' => number_format($payment->amount_cents / 100, 2, ',', ' ').' '.$payment->currency,
                'date' => $payment->confirmed_at->toISOString(),
                'href' => route('dashboard.admin.finance.index', $yearFilter + ['academic' => $payment->academic_enrollment_id], false),
            ])->all();
    }

    private function shortcut(string $key, string $label, string $detail, string $href): array
    {
        return compact('key', 'label', 'detail', 'href');
    }

    private function metric(string $key, string $label, int $value, string $detail, string $href): array
    {
        return compact('key', 'label', 'value', 'detail', 'href');
    }

    private function action(string $key, string $label, int $count, string $detail, string $href): array
    {
        return compact('key', 'label', 'count', 'detail', 'href');
    }
}
