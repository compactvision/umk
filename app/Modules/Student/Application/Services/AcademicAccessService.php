<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AccessRule;

final class AcademicAccessService
{
    public function __construct(private StudentFinanceService $finance) {}

    public function decision(AcademicEnrollment $entry, string $feature): array
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
        $rule = AccessRule::where('feature', $feature)->where('is_active', true)->where(fn ($q) => $q->whereNull('academic_year_id')->orWhere('academic_year_id', $entry->academic_year_id))->where(fn ($q) => $q->whereNull('level_id')->orWhere('level_id', $entry->level_id))->orderByRaw('CASE WHEN level_id IS NULL THEN 0 ELSE 1 END DESC')->orderByRaw('CASE WHEN academic_year_id IS NULL THEN 0 ELSE 1 END DESC')->latest('id')->first();
        if ($rule?->mode === 'hidden') {
            return ['allowed' => false, 'visible' => false, 'reason' => 'Ce service n’est pas proposé pour votre parcours académique.'];
        }
        $adjustments = $this->finance->activeAdjustments($entry);
        if ($adjustments->contains(fn ($a) => $a->type === 'override' && $a->feature === $feature)) {
            return $yes;
        }
        if (! $rule) {
            return in_array($feature, config('student.requires_rule'), true) ? ['allowed' => false, 'reason' => 'Les conditions d’accès à ce service doivent être définies par l’administration.'] : $yes;
        }
        if ($rule->mode === 'open') {
            return $yes;
        }
        $balance = $this->finance->balance($entry, $rule->fee_kind);
        if (! $balance['assessed']) {
            return ['allowed' => false, 'reason' => 'La catégorie tarifaire de votre dossier doit être confirmée par le service financier.'];
        }
        if ($rule->allow_exemption && $adjustments->contains(fn ($a) => $a->type === 'exemption' && $a->fee_kind === $rule->fee_kind)) {
            return $yes;
        }
        if ($rule->allow_plan) {
            foreach ($adjustments->where('type', 'plan')->where('fee_kind', $rule->fee_kind) as $plan) {
                $required = collect($plan->schedule ?? [])->filter(fn ($row) => $row['due_at'] <= today('Africa/Kinshasa')->toDateString())->sum('amount_cents');
                if ($balance['paid_cents'] >= $required) {
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
        return collect(config('student.features'))->mapWithKeys(fn ($feature) => [$feature => $this->decision($entry, $feature)])->all();
    }

    public function courses(AcademicEnrollment $entry): \Illuminate\Support\Collection
    {
        if (!$this->decision($entry, 'courses_view')['allowed']) return collect();
        $formatSemester = fn ($semester) => match ((string) $semester) {
            '1' => '1er semestre', '2' => '2e semestre', default => $semester,
        };
        $published = $this->offerings($entry)->with(['course', 'professor'])->get()->map(fn ($offering) => [
            'id' => $offering->id, 'course_id' => $offering->course_id, 'detail_url' => '/dashboard/student/courses/'.$offering->course_id.'?academic='.$entry->id, 'title' => $offering->course->title,
            'code' => $offering->course->code, 'credits' => $offering->course->credits,
            'semester' => $formatSemester($offering->semester ?: $offering->course->semester),
            'teacher' => $offering->professor?->full_name ?? $offering->course->teacher,
            'catalog_only' => false,
        ]);
        // A configured offering remains subject to its publication, group and optional-course rules.
        $configured = AcademicOffering::where('level_id', $entry->level_id)
            ->where('academic_year_id', $entry->academic_year_id)->select('course_id');
        $catalog = \App\Models\Courses::where('level_id', $entry->level_id)
            ->whereNotIn('id', $configured)->get()->map(fn ($course) => [
                'id' => -$course->id, 'course_id' => $course->id, 'detail_url' => '/dashboard/student/courses/'.$course->id.'?academic='.$entry->id, 'title' => $course->title, 'code' => $course->code,
                'credits' => $course->credits, 'semester' => $formatSemester($course->semester),
                'teacher' => null, 'catalog_only' => true,
            ]);

        return $published->concat($catalog)->sortBy([['semester', 'asc'], ['title', 'asc']])->values();
    }

    public function offerings(AcademicEnrollment $entry)
    {
        return AcademicOffering::query()->where('is_published', true)->where('level_id', $entry->level_id)->where('academic_year_id', $entry->academic_year_id)
            ->where(fn ($q) => $q->whereNull('class_id')->orWhere('class_id', $entry->class_id ?? -1))
            ->whereDoesntHave('exceptions', fn ($q) => $q->where('academic_enrollment_id', $entry->id)->where('action', 'exclude'))
            ->where(fn ($q) => $q->where('is_optional', false)->orWhereHas('exceptions', fn ($e) => $e->where('academic_enrollment_id', $entry->id)->where('action', 'include')));
    }
}
