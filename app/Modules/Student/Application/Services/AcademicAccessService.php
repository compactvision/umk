<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\CurriculumItem;
use App\Models\Courses;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Models\Student\AccessRule;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final class AcademicAccessService
{
    /** Per service instance; entries and their historical references are never shared across requests. */
    private \WeakMap $curriculumByEnrollment;

    public function __construct(private StudentFinanceService $finance, private EnrollmentMembershipHistory $membership)
    {
        $this->curriculumByEnrollment = new \WeakMap;
    }

    public function decision(AcademicEnrollment $entry, string $feature): array
    {
        return $this->evaluate($entry, $feature,
            fn () => $this->rules($entry)->where('feature', $feature)->first(),
            fn () => $this->finance->activeAdjustments($entry),
            fn ($kind) => $this->finance->balance($entry, $kind),
        );
    }

    private function evaluate(AcademicEnrollment $entry, string $feature, Closure $findRule, Closure $readAdjustments, Closure $readBalance): array
    {
        $yes = ['allowed' => true, 'reason' => null];
        if (! in_array($feature, config('student.features'), true)) {
            return ['allowed' => false, 'reason' => 'Service inconnu.'];
        }
        if (in_array($feature, config('student.essential'), true)) {
            return $yes;
        }
        if (! in_array($entry->profile->student_status, ['active', 'graduated'], true) || ! in_array($entry->enrollment_status, ['confirmed', 'completed'], true) || $entry->application?->status?->value !== 'validated') {
            return ['allowed' => false, 'reason' => 'Votre inscription ou votre profil n’est pas actif. Contactez le service des inscriptions.'];
        }
        if (in_array($feature, ['assignments_submit', 'evaluations_participate'], true) && ($entry->profile->student_status !== 'active' || $entry->enrollment_status !== 'confirmed')) {
            return ['allowed' => false, 'reason' => 'Les dépôts et évaluations nécessitent une inscription active.'];
        }
        if (in_array($feature, ['assignments_submit', 'evaluations_participate']) && $entry->academicYear->status !== 'open') {
            return ['allowed' => false, 'reason' => 'Cette année académique est clôturée.'];
        }
        $rule = $findRule();
        if ($rule?->mode === 'hidden') {
            return ['allowed' => false, 'visible' => false, 'reason' => 'Ce service n’est pas proposé pour votre parcours académique.'];
        }
        $adjustments = $readAdjustments();
        if ($adjustments->contains(fn ($a) => $a->type === 'override' && $a->feature === $feature)) {
            return $yes;
        }
        if (! $rule) {
            return in_array($feature, config('student.requires_rule'), true) ? ['allowed' => false, 'reason' => 'Les conditions d’accès à ce service doivent être définies par l’administration.'] : $yes;
        }
        if ($rule->mode === 'open') {
            return $yes;
        }
        $balance = $readBalance($rule->fee_kind);
        if (! $balance['assessed']) {
            return ['allowed' => false, 'reason' => 'La catégorie tarifaire de votre dossier doit être confirmée par le service financier.'];
        }
        if ($rule->allow_exemption && $adjustments->contains(fn ($a) => $a->type === 'exemption' && $a->fee_kind === $rule->fee_kind)) {
            return $yes;
        }
        if ($rule->allow_plan) {
            foreach ($adjustments->where('type', 'plan')->where('fee_kind', $rule->fee_kind) as $plan) {
                $required = collect($plan->schedule ?? [])->filter(fn ($row) => $row['due_at'] <= today('Africa/Kinshasa')->toDateString())->sum('amount_cents');
                if (array_sum(array_column($plan->schedule ?? [], 'amount_cents')) === $balance['due_cents'] && $balance['paid_cents'] >= $required) {
                    return $yes;
                }
            }
        }
        $required = match ($rule->mode) {
            'full' => $balance['due_cents'],
            'minimum' => min($balance['due_cents'], (int) $rule->minimum_cents),
            'first_installment' => min($balance['due_cents'], max(0, (int) $entry->obligations()->where('kind', $rule->fee_kind)->orderBy('installment')->value('amount_cents') - $balance['waived_cents'])),
            default => PHP_INT_MAX,
        };
        if ($rule->mode !== 'exemption' && $balance['paid_cents'] >= $required && $balance['overdue_cents'] === 0) {
            return $yes;
        }

        return ['allowed' => false, 'reason' => $rule->mode === 'exemption' ? 'Ce service nécessite une exonération autorisée.' : 'Les versements confirmés ne satisfont pas encore les conditions financières de ce service. Consultez vos frais ou le service financier.'];
    }

    public function permissions(AcademicEnrollment $entry): array
    {
        $features = config('student.features');
        $rules = $adjustments = null;
        $balances = [];
        $readAdjustments = function () use ($entry, &$adjustments) {
            return $adjustments ??= $this->finance->activeAdjustments($entry);
        };
        $readBalance = function (?string $kind) use ($entry, &$balances) {
            return $balances[$kind ?? ''] ??= $this->finance->balance($entry, $kind);
        };

        $permissions = [];
        foreach ($features as $feature) {
            $findRule = function () use ($entry, $features, $feature, &$rules) {
                $rules ??= $this->rules($entry)->whereIn('feature', $features)->get()->unique('feature')->keyBy('feature');

                return $rules->get($feature);
            };
            $permissions[$feature] = $this->evaluate($entry, $feature, $findRule, $readAdjustments, $readBalance);
        }

        return $permissions;
    }

    private function rules(AcademicEnrollment $entry): Builder
    {
        return AccessRule::where('is_active', true)
            ->where(fn ($q) => $q->whereNull('academic_year_id')->orWhere('academic_year_id', $entry->academic_year_id))
            ->where(fn ($q) => $q->whereNull('level_id')->orWhere('level_id', $entry->level_id))
            ->orderByRaw('CASE WHEN level_id IS NULL THEN 0 ELSE 1 END DESC')
            ->orderByRaw('CASE WHEN academic_year_id IS NULL THEN 0 ELSE 1 END DESC')
            ->latest('id');
    }

    public function curriculumItems(AcademicEnrollment $entry): ?Collection
    {
        if ($entry->curriculum_version_id === null) {
            return null;
        }
        if (isset($this->curriculumByEnrollment[$entry])) {
            return $this->curriculumByEnrollment[$entry];
        }
        $version = $entry->curriculumVersion;
        if (! $version) {
            return collect();
        }
        $load = fn () => $version->units()->where('level_id', $entry->level_id)->with('items')->get()->flatMap(function ($unit) {
            return $unit->items->each(fn ($item) => $item->setRelation('unit', $unit));
        })->keyBy('source_course_id');
        $ttl = (int) config('teaching.curriculum_cache_seconds');
        if ($ttl <= 0 || ! $version->published_at) {
            return $this->curriculumByEnrollment[$entry] = $load();
        }
        // The cache contains the immutable catalog snapshots only, never a roster or an access decision.
        $key = implode(':', ['teaching', 'curriculum-items', 'v1', $version->program_snapshot['university_id'] ?? 0,
            $entry->academic_year_id, $version->academic_program_id, $version->id, $version->revision, $entry->level_id]);

        return $this->curriculumByEnrollment[$entry] = Cache::remember($key, $ttl, $load);
    }

    public function reference(AcademicEnrollment $entry, Courses $course, ?CurriculumItem $item = null): array
    {
        $reference = $course->only(['id', 'title', 'code', 'description', 'credits', 'semester', 'cmi_hours', 'td_hours', 'tp_hours', 'pedagogical_content']);
        $item ??= $this->curriculumItems($entry)?->get($course->id);
        if ($item) {
            $reference = array_replace($reference, $item->only(['code', 'description', 'cmi_hours', 'td_hours', 'tp_hours', 'pedagogical_content']), ['curriculum_item_id' => $item->id, 'curriculum_unit_id' => $item->curriculum_unit_id, 'curriculum_version_id' => $entry->curriculum_version_id, 'title' => $item->name, 'credits' => $item->credits === null ? null : (float) $item->credits, 'coefficient' => $item->coefficient === null ? null : (float) $item->coefficient, 'semester' => $item->unit->period_name, 'unit' => $item->unit->name, 'unit_code' => $item->unit->code, 'is_optional' => $item->is_optional]);
        }

        return $reference;
    }

    public function curriculumContext(AcademicEnrollment $entry): ?array
    {
        if ($entry->curriculum_version_id === null) {
            return null;
        }
        $items = $this->curriculumItems($entry);
        $version = $entry->curriculumVersion;

        return $version ? ['id' => $version->id, 'code' => $version->code, 'name' => $version->name, 'status' => $version->status, 'program' => $version->program_snapshot['name'], 'cycle' => $version->program_snapshot['cycle'], 'level' => $items->first()?->unit->level_title, 'faculty' => $version->program_snapshot['faculty'] ?? null, 'cohort' => $entry->admissionCohort?->name, 'promotion' => AcademicPromotion::where('academic_program_id', $version->academic_program_id)->where('level_id', $entry->level_id)->where('academic_year_id', $entry->academic_year_id)->value('name')] : null;
    }

    public function courses(AcademicEnrollment $entry): Collection
    {
        if (! $this->decision($entry, 'courses_view')['allowed']) {
            return collect();
        }
        $formatSemester = fn ($semester) => match ((string) $semester) {
            '1' => '1er semestre', '2' => '2e semestre', default => $semester,
        };
        $published = $this->offerings($entry)->with(['course', 'professor', 'curriculumItem.unit'])->get()->map(function ($offering) use ($entry, $formatSemester) {
            $reference = $this->reference($entry, $offering->course, $offering->curriculumItem);

            return [
                'id' => $offering->id, 'course_id' => $offering->course_id, 'detail_url' => '/dashboard/student/courses/'.$offering->course_id.'?academic='.$entry->id,
                'title' => $reference['title'], 'code' => $reference['code'], 'credits' => $reference['credits'],
                'semester' => $entry->curriculum_version_id !== null ? $reference['semester'] : $formatSemester($offering->semester ?: $offering->course->semester),
                'teacher' => $offering->professor?->full_name ?? $offering->course->teacher, 'unit' => $reference['unit'] ?? null,
                'registered' => $offering->curriculum_item_id !== null, 'is_optional' => $offering->is_optional,
                'archived' => $offering->archived_at !== null, 'catalog_only' => false,
            ];
        });
        $catalog = $this->catalog($entry)->get()->map(function ($course) use ($entry, $formatSemester) {
            $reference = $this->reference($entry, $course);

            return [
                'id' => -$course->id, 'course_id' => $course->id, 'detail_url' => '/dashboard/student/courses/'.$course->id.'?academic='.$entry->id,
                'title' => $reference['title'], 'code' => $reference['code'], 'credits' => $reference['credits'], 'semester' => $formatSemester($reference['semester']),
                'unit' => $reference['unit'] ?? null, 'is_optional' => $reference['is_optional'] ?? false, 'teacher' => null, 'catalog_only' => true,
            ];
        });

        return $published->concat($catalog)->sortBy([['semester', 'asc'], ['title', 'asc']])->values();
    }

    public function catalog(AcademicEnrollment $entry): Builder
    {
        $configured = AcademicOffering::where('level_id', $entry->level_id)
            ->where(fn ($q) => $q->where('academic_year_id', $entry->academic_year_id)->orWhere(fn ($legacy) => $legacy->whereNull('curriculum_item_id')->whereNotNull('academic_department_id')))
            ->where(fn ($q) => $q->whereNull('curriculum_item_id')->orWhereIn('curriculum_item_id', $this->curriculumItems($entry)?->pluck('id')->all() ?? []))
            ->select('course_id');

        return Courses::where('level_id', $entry->level_id)
            ->when($entry->curriculum_version_id !== null, fn ($q) => $q->whereIn('id', $this->curriculumItems($entry)->keys()), fn ($q) => $q->where('catalog_status', 'active'))
            ->whereNotIn('id', $configured);
    }

    private function contextOfferings(AcademicEnrollment $entry, bool $forSessions = false): Builder
    {
        $items = $this->curriculumItems($entry);

        return AcademicOffering::where('is_published', true)->where('academic_year_id', $entry->academic_year_id)
            ->where(function ($context) use ($entry, $forSessions, $items) {
                $context->where(function ($normal) use ($entry, $forSessions, $items) {
                    $normal->where('level_id', $entry->level_id)
                        ->when($items !== null, fn ($q) => $q->whereIn('course_id', $items->keys()))
                        ->where(function ($q) use ($entry, $forSessions, $items) {
                            $q->where(function ($legacy) use ($entry, $forSessions) {
                                $legacy->whereNull('curriculum_item_id')
                                    ->when(! $forSessions, fn ($query) => $query->whereNull('archived_at'))
                                    ->whereDoesntHave('exceptions', fn ($e) => $e->where('academic_enrollment_id', $entry->id)->where('action', 'exclude'))
                                    ->where(fn ($offer) => $offer->where('is_optional', false)->orWhereHas('exceptions', fn ($e) => $e->where('academic_enrollment_id', $entry->id)->where('action', 'include')));
                            })->orWhere(function ($managed) use ($entry, $forSessions, $items) {
                                $managed->whereIn('curriculum_item_id', $items?->pluck('id')->all() ?? [])
                                    ->when(! $forSessions, fn ($query) => $query->whereHas('registrations', fn ($r) => $r->where('academic_enrollment_id', $entry->id)->whereNull('withdrawn_at')));
                            });
                        });
                });
                if ($entry->curriculum_version_id !== null) {
                    $context->orWhere(fn ($retake) => $retake
                        ->whereHas('curriculumItem', fn ($item) => $item->where('curriculum_version_id', $entry->curriculum_version_id))
                        ->whereHas('registrations', fn ($row) => $row->where('academic_enrollment_id', $entry->id)->whereHas('retakeAssignment')
                            ->when(! $forSessions, fn ($q) => $q->whereNull('withdrawn_at'))));
                }
            });
    }

    public function offerings(AcademicEnrollment $entry): Builder
    {
        return $this->contextOfferings($entry)
            ->where(fn ($q) => $q->whereNull('academic_department_id')->orWhere('academic_department_id', $entry->academic_department_id ?? -1))
            ->where(fn ($q) => $q->whereNull('class_id')->orWhere('class_id', $entry->class_id ?? -1));
    }

    public function sessions(AcademicEnrollment $entry): Builder
    {
        $query = AcademicSession::where('is_published', true)
            ->whereIn('academic_offering_id', $this->contextOfferings($entry, true)->select('academic_offerings.id'))
            ->whereHas('offering', fn ($offering) => $offering
                ->where(fn ($q) => $q->whereNull('archived_at')->orWhereColumn('academic_sessions.starts_at', '<', 'academic_offerings.archived_at'))
                ->where(fn ($q) => $q->whereNull('curriculum_item_id')->orWhereHas('registrations', fn ($r) => $r
                    ->where('academic_enrollment_id', $entry->id)->whereColumn('registered_at', '<=', 'academic_sessions.starts_at')
                    ->where(fn ($w) => $w->whereNull('withdrawn_at')->orWhereColumn('withdrawn_at', '>', 'academic_sessions.starts_at')))));
        if (! $this->decision($entry, 'schedule_view')['allowed']) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function ($scopes) use ($entry) {
            foreach ($this->membership->segments($entry) as $segment) {
                $scopes->orWhere(function ($window) use ($segment) {
                    if ($segment['from']) {
                        $window->where('starts_at', '>=', $segment['from']);
                    }
                    if ($segment['until']) {
                        $window->where('starts_at', '<', $segment['until']);
                    }
                    $window->whereHas('offering', fn ($offering) => $offering
                        ->where(fn ($q) => $q->whereNull('class_id')->orWhere('class_id', $segment['class_id'] ?? -1))
                        ->where(fn ($q) => $q->whereNull('academic_department_id')->orWhere('academic_department_id', $segment['academic_department_id'] ?? -1)));
                });
            }
        });
    }
}
