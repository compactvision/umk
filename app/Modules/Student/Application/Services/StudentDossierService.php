<?php

namespace App\Modules\Student\Application\Services;

use App\Models\EnrollmentEvent;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicUnitResult;
use App\Models\Student\FinancialAdjustment;
use App\Models\Student\StudentObligation;
use App\Models\Student\StudentPayment;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class StudentDossierService
{
    public function __construct(private AcademicAccessService $academic, private StudentFinanceService $finance) {}

    public function details(AcademicEnrollment $entry, User $staff, string $section = "all", int $page = 1): array
    {
        $access = $staff->can('manage academic access');
        $load = fn (array $sections) => $section === 'all' || in_array($section, $sections, true);
        $history = $access && $load(['Identité', 'Historique']);
        $teaching = $access || $staff->can('publish academic content');
        $finance = $staff->can('manage academic finance');
        $profile = $entry->profile;
        $admission = $access && $load(['Identité', 'Admission', 'Documents']) ? $entry->application : null;
        $attendancePage = $teaching && $load(['Présences']) ? AcademicAttendance::query()
            ->join('academic_sessions', 'academic_sessions.id', '=', 'academic_attendances.academic_session_id')
            ->join('academic_offerings', 'academic_offerings.id', '=', 'academic_sessions.academic_offering_id')
            ->join('courses', 'courses.id', '=', 'academic_offerings.course_id')
            ->leftJoin('academic_absence_justifications as absence_case', 'absence_case.academic_attendance_id', '=', 'academic_attendances.id')
            ->whereNull('academic_sessions.cancelled_at')->where('academic_attendances.academic_enrollment_id', $entry->id)
            ->orderByDesc('academic_sessions.starts_at')
            ->simplePaginate(25, ['academic_attendances.id', 'academic_attendances.status', 'absence_case.status as justification_status', 'academic_sessions.starts_at', 'courses.title'], 'records_page', $page) : null;
        $attendance = collect($attendancePage?->items() ?? [])->map(fn ($record) => [
                'id' => $record->id, 'status' => $record->justification_status === 'accepted' ? 'excused' : $record->status, 'title' => $record->title,
                'starts_at' => \Carbon\CarbonImmutable::parse($record->starts_at, 'UTC')->toIso8601String(),
            ]);
        $resourcePage = $teaching && $load(['Académique', 'Documents']) ? AcademicResource::query()->where('student_profile_id', $profile->id)
            ->whereHas('offering', fn ($query) => $query->where('academic_year_id', $entry->academic_year_id)->where('level_id', $entry->level_id))
            ->whereIn('kind', ['result', 'document'])->where('is_published', true)
            ->orderByDesc('updated_at')->orderByDesc('id')->simplePaginate(25, ['id', 'kind', 'title', 'path', 'updated_at'], 'records_page', $page) : null;
        $resources = collect($resourcePage?->items() ?? []);
        $scopedEnrollments = AcademicStaffScope::apply($profile->enrollments()->getQuery(), $staff);
        $ids = (clone $scopedEnrollments)->select('academic_enrollments.id');
        $auditQuery = AcademicAudit::query()->where(fn ($query) => $query
            ->where(fn ($scope) => $scope->where('entity_type', 'student_profiles')->where('entity_id', $profile->id))
            ->orWhere(fn ($scope) => $scope->where('entity_type', 'academic_enrollments')->whereIn('entity_id', $ids))
            ->when($finance, function ($query) use ($ids) {
                foreach ([new StudentPayment, new StudentObligation, new FinancialAdjustment] as $entity) {
                    $query->orWhere(fn ($scope) => $scope->where('entity_type', $entity->getTable())
                        ->whereIn('entity_id', $entity->newQuery()->whereIn('academic_enrollment_id', $ids)->select('id')));
                }
            }))
            ->when(!$finance, fn ($query) => $query->where('action', '!=', 'fees_assessed'))
            ->when($section === 'Identité', fn ($query) => $query->where('action', 'student_profile_updated'))
            ->selectRaw("id, action, created_at as date, 'audit' as source");
        $events = EnrollmentEvent::whereIn('enrollment_id', (clone $scopedEnrollments)->select('academic_enrollments.application_id'))
            ->selectRaw("id, event as action, occurred_at as date, 'admission' as source");
        if ($section !== 'Identité') {
            $auditQuery->unionAll($events);
        }
        $timelinePage = $history ? DB::query()->fromSub($auditQuery, 'student_timeline')
            ->orderByDesc('date')->orderBy('source')->orderByDesc('id')
            ->simplePaginate(25, ['*'], 'records_page', $page) : null;
        $timeline = collect($timelinePage?->items() ?? [])->map(fn ($event) => [
            'id' => $event->source.'-'.$event->id, 'action' => $event->action,
            'date' => $event->date ? \Carbon\Carbon::parse($event->date)->toIso8601String() : null,
        ]);

        return [
            'identity' => $access && $load(['Identité']) ? Arr::only($profile->personal_details ?? [], ['phone', 'home_address', 'residence_commune', 'birth_date', 'birth_place', 'emergency_name', 'emergency_relationship', 'emergency_phone', 'emergency_address']) : null,
            'identityHistory' => $timeline->where('action', 'student_profile_updated')->values(),
            'admission' => $admission ? [
                'reference' => $admission->reference,
                'decision' => $admission->status_label,
                'url' => route('dashboard.admin.enrollments.show', $admission->id),
                'documents' => $admission->documents()->where('is_temp', false)->orderBy('id')->get(['uuid', 'filename', 'type', 'review_status'])
                    ->map(fn ($document) => ['id' => $document->uuid, 'title' => $document->filename, 'type' => $document->type, 'status' => $document->review_status,
                        'url' => route('dashboard.admin.enrollments.documents.preview', $document->uuid)]),
            ] : null,
            'teaching' => $teaching,
            'courses' => $teaching && $load(['Académique']) ? $this->academic->courses($entry)->map(fn ($course) => Arr::only($course, ['id', 'title', 'code', 'credits', 'semester'])) : [],
            'unitResults' => $teaching && $load(['Académique']) ? $this->unitResults($entry, $staff->can('publish academic content')) : null,
            'attendance' => $attendance,
            'results' => $resources->where('kind', 'result')->map(fn ($resource) => $resource->only(['id', 'title', 'updated_at']))->values(),
            'documents' => $resources->where('kind', 'document')->map(fn ($resource) => ['id' => $resource->id, 'title' => $resource->title, 'updated_at' => $resource->updated_at, 'url' => $resource->path ? route('dashboard.admin.student-academic.documents.download', [$entry->id, $resource->id]) : null])->values(),
            'finance' => $finance && $load(['Finances']) ? $this->finances($entry, $page) : null,
            'requests' => $access && $load(['Demandes']) ? \App\Models\Student\ServiceRequest::whereIn('academic_enrollment_id', $ids)->latest()->simplePaginate(25, ['id', 'academic_enrollment_id', 'category', 'subject', 'body', 'status', 'response', 'created_at'], 'records_page', $page) : null,
            'records' => ['page' => $page, 'more' => ($resourcePage?->hasMorePages() ?? false) || ($attendancePage?->hasMorePages() ?? false) || ($timelinePage?->hasMorePages() ?? false)],
            'timeline' => $timeline,
        ];
    }

    public function saveUnitResult(int $entryId, int $unitId, array $data, int $actorId): void
    {
        DB::transaction(function () use ($entryId, $unitId, $data, $actorId) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entryId);
            if (\App\Models\Student\AcademicOfficialResult::published()->where('academic_enrollment_id', $entry->id)->exists()) {
                throw ValidationException::withMessages(['score' => 'Utilisez la rectification du résultat officiel pour ce dossier.']);
            }
            $version = $entry->curriculumVersion;
            if (!$version || !in_array($version->status, ['published', 'replaced', 'archived'], true)) {
                throw ValidationException::withMessages(['score' => 'Cette inscription doit être rattachée à une maquette publiée.']);
            }
            $version->units()->where('level_id', $entry->level_id)->findOrFail($unitId);
            $result = AcademicUnitResult::updateOrCreate(
                ['academic_enrollment_id' => $entry->id, 'curriculum_unit_id' => $unitId],
                $data,
            );
            if ($result->wasRecentlyCreated || $result->wasChanged(['score', 'validated'])) {
                Audit::record($actorId, 'academic_unit_result_saved', $entry, data: [
                    'unit_id' => $unitId, 'score' => $result->score, 'validated' => $result->validated,
                ]);
            }
        }, 3);
    }

    private function unitResults(AcademicEnrollment $entry, bool $canEdit): array
    {
        $version = $entry->curriculumVersion;
        $units = $version?->units()->where('level_id', $entry->level_id)->with('items:id,curriculum_unit_id,credits')->get() ?? collect();
        $results = AcademicUnitResult::where('academic_enrollment_id', $entry->id)
            ->whereIn('curriculum_unit_id', $units->pluck('id'))->get()->keyBy('curriculum_unit_id');
        $rows = $units->map(function ($unit) use ($results) {
            $result = $results->get($unit->id);
            $credits = $unit->expected_credits;
            if ($credits === null && $unit->credit_rule !== 'independent' && $unit->items->isNotEmpty() && !$unit->items->contains('credits', '===', null)) {
                $credits = $unit->items->sum('credits');
            }

            return [
                'id' => $unit->id, 'code' => $unit->code, 'name' => $unit->name, 'period' => $unit->period_name,
                'credits' => $credits === null ? null : (float) $credits,
                'score' => $result ? (float) $result->score : null, 'validated' => $result?->validated,
            ];
        });

        $validatedUnits = $rows->where('validated', true);

        return [
            'units' => $rows,
            'average' => $results->isEmpty() ? null : round($results->avg('score'), 2),
            'earnedCredits' => $results->isEmpty() || $validatedUnits->contains('credits', '===', null) ? null : (float) $validatedUnits->sum('credits'),
            'requiredCredits' => $rows->isEmpty() || $rows->contains('credits', '===', null) ? null : (float) $rows->sum('credits'),
            'editable' => $canEdit && $version && in_array($version->status, ['published', 'replaced', 'archived'], true),
        ];
    }

    private function finances(AcademicEnrollment $entry, int $page = 1): array
    {
        $obligations = $entry->obligations()->orderBy('due_at')->orderBy('installment')->get(['id', 'title', 'kind', 'amount_cents', 'due_at']);
        $adjustments = $this->finance->activeAdjustments($entry)->whereIn('type', ['plan', 'scholarship', 'exemption'])->values();
        $nextDue = collect($this->finance->statement($entry)['schedules'])->flatten(1)->filter(fn ($row) => $row['remaining_cents'] > 0 && $row['due_at'])->sortBy('due_at')->first()['due_at'] ?? null;

        $payments = $entry->payments()->latest()->orderByDesc('id')->simplePaginate(25, ['id', 'reference', 'amount_cents', 'currency', 'status', 'created_at'], 'records_page', $page);

        return [
            'more_payments' => $payments->hasMorePages(),
            'balance' => $this->finance->balance($entry),
            'nextDue' => $nextDue,
            'obligations' => $obligations,
            'payments' => $payments->items(),
            'adjustments' => $adjustments->map(fn ($adjustment) => $adjustment->only(['id', 'type', 'fee_kind', 'amount_cents', 'schedule'])),
        ];
    }
}
