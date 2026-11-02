<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AdmissionCondition;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSession;
use Illuminate\Support\Str;

final class StudentOverviewService
{
    public function __construct(private AcademicAccessService $access, private StudentFinanceService $finance) {}

    public function summary(AcademicEnrollment $entry, array $permissions, array $balance): array
    {
        $now = now('Africa/Kinshasa');
        $offerings = $this->access->offerings($entry)->select('academic_offerings.id');
        $sessions = AcademicSession::query()->whereIn('academic_offering_id', $offerings)->where('is_published', true)
            ->where('ends_at', '>', $now->copy()->utc());
        // The daily timetable includes all published lessons of the day.
        $today = AcademicSession::query()->whereIn('academic_offering_id', $offerings)->where('is_published', true)->where('ends_at', '>', $now->copy()->startOfDay()->utc())->where('starts_at', '<=', $now->copy()->endOfDay()->utc());
        $week = (clone $sessions)->where('starts_at', '<=', $now->copy()->endOfWeek()->utc());
        $formatSessions = fn ($query) => $query->with('offering.course')->orderBy('starts_at')->limit(6)->get()->map(fn ($session) => [
            'id' => $session->id, 'course' => $session->offering->course->title, 'starts_at' => $session->starts_at,
            'ends_at' => $session->ends_at, 'room' => $session->room, 'ongoing' => $session->starts_at->lte($now) && $session->ends_at->gt($now),
        ])->values();
        $resources = AcademicResource::query()->whereIn('academic_offering_id', $offerings)->where('is_published', true)
            ->where(fn ($query) => $query->whereNull('student_profile_id')->orWhere('student_profile_id', $entry->student_profile_id));
        $canReadCourses = $permissions['courses_view']['allowed'];
        $canReadResults = $canReadCourses && $permissions['results_view']['allowed'];
        $formatResource = fn ($resource) => [
            'id' => $resource->id, 'title' => $resource->title, 'course' => $resource->offering->course->title,
            'excerpt' => $resource->kind === 'evaluation' && ! $permissions['evaluations_participate']['allowed'] ? '' : Str::limit(trim(strip_tags($resource->body ?? '')), 260),
            'updated_at' => $resource->updated_at, 'opens_at' => $resource->opens_at, 'closes_at' => $resource->closes_at,
        ];
        $results = $canReadResults ? (clone $resources)->with('offering.course')->where('kind', 'result')->where('student_profile_id', $entry->student_profile_id)->latest('updated_at')->orderByDesc('id')->limit(4)->get()->map($formatResource)->values() : collect();
        $announcements = $canReadCourses ? (clone $resources)->with('offering.course')->where('kind', 'announcement')->latest('updated_at')->orderByDesc('id')->limit(4)->get()->map($formatResource)->values() : collect();
        $evaluations = $canReadCourses && ($permissions['evaluations_participate']['visible'] ?? true) ? (clone $resources)->with('offering.course')->where('kind', 'evaluation')->whereNotNull('opens_at')->where('opens_at', '>=', $now->copy()->utc())->where('opens_at', '<=', $now->copy()->addDays(14)->utc())->orderBy('opens_at')->limit(4)->get()->map($formatResource)->values() : collect();
        $ongoing = $canReadCourses && ($permissions['evaluations_participate']['visible'] ?? true) ? (clone $resources)->with('offering.course')->where('kind', 'evaluation')->whereNotNull('opens_at')->where('opens_at', '<=', $now->copy()->utc())->where(fn ($query) => $query->whereNull('closes_at')->orWhere('closes_at', '>', $now->copy()->utc()))->orderBy('closes_at')->limit(6)->get()->map($formatResource)->values() : collect();
        $fees = $entry->obligations()->distinct()->pluck('kind')->map(fn ($kind) => ['kind' => $kind, 'title' => $kind === 'tuition' ? 'Frais académiques' : 'Frais connexes · '.$entry->obligations()->where('kind', $kind)->value('title'), 'balance' => $this->finance->balance($entry, $kind)])->values();
        $documents = $entry->application->documents()->get(['key', 'review_status']);
        $required = AdmissionCondition::where('is_required', true)->whereIn('section', ['personal_info', 'academic_info'])
            ->where(fn ($query) => $query->where('level_id', $entry->level_id)->orWhere(fn ($faculty) => $faculty->whereNull('level_id')->where('faculty_id', $entry->level->faculty_id)))->get(['title']);
        $missing = $required->filter(fn ($condition) => ! $documents->contains('key', Str::slug($condition->title, '_')))->pluck('title')->values();
        $toReview = $documents->whereIn('review_status', ['rejected', 'correction_requested'])->count();
        $alerts = collect();
        if ($balance['overdue_cents'] > 0) {
            $alerts->push(['id' => 'overdue', 'tone' => 'warning', 'title' => 'Une échéance de paiement est dépassée', 'message' => 'Consultez le montant en retard et contactez le service financier si nécessaire.', 'section' => 'fees']);
        }
        if ($missing->isNotEmpty() || $toReview > 0) {
            $alerts->push(['id' => 'documents', 'tone' => 'warning', 'title' => 'Votre dossier nécessite une vérification', 'message' => $missing->isNotEmpty() ? 'Pièces obligatoires absentes : '.$missing->implode(', ').'. Contactez le service des inscriptions.' : $toReview.' pièce(s) portent une remarque. Consultez votre dossier et les instructions du service.', 'section' => 'application']);
        }
        if ($evaluations->isNotEmpty()) {
            $alerts->push(['id' => 'evaluations', 'tone' => 'info', 'title' => 'Des évaluations approchent', 'message' => $evaluations->count().' évaluation(s) publiée(s) dans les 14 prochains jours. Consultez les dates et les modalités d’accès.', 'section' => 'evaluations']);
        }

        return [
            'fee_summary' => $fees, 'ongoing_evaluations' => $ongoing,
            'generated_at' => $now->toIso8601String(), 'timezone' => 'Africa/Kinshasa',
            'today_count' => $permissions['schedule_view']['allowed'] ? (clone $today)->count() : 0,
            'week_count' => $permissions['schedule_view']['allowed'] ? (clone $week)->count() : 0,
            'today_sessions' => $permissions['schedule_view']['allowed'] ? $formatSessions(clone $today) : [],
            'week_sessions' => $permissions['schedule_view']['allowed'] ? $formatSessions(clone $week) : [],
            'alerts' => $alerts->values(), 'latest_results' => $results, 'announcements' => $announcements,
            'upcoming_evaluations' => $evaluations, 'missing_documents' => $missing,
            'course_count' => $canReadCourses ? $this->access->courses($entry)->count() : 0,
        ];
    }
}
