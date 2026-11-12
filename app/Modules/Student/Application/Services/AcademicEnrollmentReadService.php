<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class AcademicEnrollmentReadService
{
    public function query(User $actor, array $filters): Builder
    {
        return AcademicStaffScope::apply(AcademicEnrollment::query(), $actor)
            ->with(['profile.user', 'academicYear', 'level.faculty', 'curriculumVersion', 'promotion.program', 'admissionCohort.program', 'group.intake', 'group.promotion'])
            ->when($filters['year'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('enrollment_status', $status))
            ->when($filters['faculty'] ?? null, fn ($q, $id) => $q->whereHas('level', fn ($level) => $level->where('faculty_id', $id)))
            ->when($filters['program'] ?? null, fn ($q, $id) => $q->where(fn ($match) => $match
                ->whereHas('curriculumVersion', fn ($version) => $version->where('academic_program_id', $id))
                ->orWhereHas('promotion', fn ($promotion) => $promotion->where('academic_program_id', $id))
                ->orWhereHas('admissionCohort', fn ($cohort) => $cohort->where('academic_program_id', $id))))
            ->when($filters['level'] ?? null, fn ($q, $id) => $q->where('level_id', $id))
            ->when($filters['promotion'] ?? null, fn ($q, $id) => $q->where(fn ($match) => $match
                ->where('academic_promotion_id', $id)
                ->orWhere(fn ($legacy) => $legacy->whereNull('academic_promotion_id')
                    ->whereHas('group', fn ($group) => $group->where('academic_promotion_id', $id)))))
            ->when($filters['group'] ?? null, fn ($q, $id) => $q->where('class_id', $id))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($match) => $match
                ->where('matricule', 'like', "%{$term}%")
                ->orWhereHas('profile', fn ($p) => $p->where('matricule', 'like', "%{$term}%"))
                ->orWhereHas('profile.user', fn ($u) => $u->where('last_name', 'like', "%{$term}%")
                    ->orWhere('first_name', 'like', "%{$term}%")->orWhere('post_name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"))));
    }

    public function row(AcademicEnrollment $entry): array
    {
        return [
            'id' => $entry->id, 'name' => trim(implode(' ', array_filter([$entry->profile->user->last_name, $entry->profile->user->post_name, $entry->profile->user->first_name]))),
            'matricule' => $entry->profile->matricule ?? $entry->matricule, 'year' => $entry->academicYear->title,
            'status' => $entry->enrollment_status, 'level' => $entry->level->title, 'faculty' => $entry->level->faculty->name,
            'program' => $entry->curriculumVersion?->program_snapshot['name'] ?? $entry->promotion?->program?->name ?? $entry->admissionCohort?->program?->name,
            'curriculum' => $entry->curriculumVersion?->code, 'group_id' => $entry->class_id, 'department_id' => $entry->academic_department_id,
            'group' => $entry->group?->intake?->name, 'promotion' => $entry->promotion?->name ?? $entry->group?->promotion?->name,
            'cohort' => $entry->admissionCohort?->name,
            'created_at' => $entry->created_at?->toIso8601String(), 'updated_at' => $entry->updated_at?->toIso8601String(),
            'context_token' => AcademicEnrollmentService::contextToken($entry),
        ];
    }
}
