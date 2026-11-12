<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

final class CourseAudience
{
    private function yearAndVersion(AcademicOffering $offering): Builder
    {
        return AcademicEnrollment::where('academic_year_id', $offering->academic_year_id)
            ->when($offering->curriculum_item_id, fn ($q) => $q->where('curriculum_version_id', $offering->curriculumItem->curriculum_version_id));
    }

    public function annualContext(AcademicOffering $offering, bool $includeLinkedRetakes = false): Builder
    {
        return $this->yearAndVersion($offering)->where(function ($scope) use ($offering, $includeLinkedRetakes) {
            $scope->where('level_id', $offering->level_id);
            if ($includeLinkedRetakes) {
                $scope->orWhereHas('courseRegistrations', fn ($rows) => $rows->where('academic_offering_id', $offering->id)->whereHas('retakeAssignment'));
            }
        });
    }

    public function candidates(AcademicOffering $offering): Builder
    {
        return $this->active($this->annualContext($offering), $offering);
    }

    public function plannedRetakeCandidates(AcademicOffering $offering): Builder
    {
        return $this->active($this->yearAndVersion($offering), $offering);
    }

    private function active(Builder $query, AcademicOffering $offering): Builder
    {
        return $query->where('enrollment_status', 'confirmed')
            ->whereHas('profile', fn ($q) => $q->where('student_status', 'active'))
            ->whereHas('application', fn ($q) => $q->where('status', 'validated'))
            ->when($offering->academic_department_id, fn ($q, $id) => $q->where('academic_department_id', $id))
            ->when($offering->class_id, fn ($q, $id) => $q->where('class_id', $id));
    }

    public function roster(AcademicOffering $offering, ?CarbonInterface $at = null): Builder
    {
        if ($offering->curriculum_item_id) {
            $context = $this->annualContext($offering, includeLinkedRetakes: true);
            $query = $at ? $context : $this->active($context, $offering);

            return $query->whereHas('courseRegistrations', fn ($q) => $q->where('academic_offering_id', $offering->id)
                ->when($at, fn ($r) => $r->where('registered_at', '<=', $at)->where(fn ($w) => $w->whereNull('withdrawn_at')->orWhere('withdrawn_at', '>', $at)),
                    fn ($r) => $r->whereNull('withdrawn_at')));
        }

        return $this->annualContext($offering)->where('enrollment_status', 'confirmed')->whereHas('profile', fn ($q) => $q->where('student_status', 'active'))
            ->when($offering->academic_department_id, fn ($q, $department) => $q->where('academic_department_id', $department))
            ->when($offering->class_id, fn ($q, $group) => $q->where('class_id', $group))
            ->whereDoesntHave('courseExceptions', fn ($q) => $q->where('academic_offering_id', $offering->id)->where('action', 'exclude'))
            ->when($offering->is_optional, fn ($q) => $q->whereHas('courseExceptions', fn ($q) => $q->where('academic_offering_id', $offering->id)->where('action', 'include')));
    }
}
