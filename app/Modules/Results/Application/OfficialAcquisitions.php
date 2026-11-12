<?php

namespace App\Modules\Results\Application;

use App\Models\AcademicStructure\CurriculumUnit;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\AcademicUnitResult;
use Illuminate\Support\Collection;

final class OfficialAcquisitions
{
    public function profiles(int $unitId, Collection $profileIds): Collection
    {
        $version = CurriculumUnit::whereKey($unitId)->value('curriculum_version_id');
        $published = AcademicOfficialResult::published()
            ->join('academic_enrollments', 'academic_enrollments.id', '=', 'academic_official_results.academic_enrollment_id')
            ->join('academic_deliberations', 'academic_deliberations.id', '=', 'academic_official_results.academic_deliberation_id')
            ->join('academic_result_rules', 'academic_result_rules.id', '=', 'academic_deliberations.academic_result_rule_id')
            ->where('academic_result_rules.curriculum_version_id', $version)->whereIn('academic_enrollments.student_profile_id', $profileIds)
            ->orderByDesc('academic_deliberations.published_at')->orderByDesc('academic_deliberations.id')
            ->get(['academic_official_results.*', 'academic_enrollments.student_profile_id'])->unique('academic_enrollment_id');
        $legacy = AcademicUnitResult::where('curriculum_unit_id', $unitId)->where('validated', true)
            ->whereNotIn('academic_unit_results.academic_enrollment_id', $published->pluck('academic_enrollment_id'))
            ->join('academic_enrollments', 'academic_enrollments.id', '=', 'academic_unit_results.academic_enrollment_id')
            ->whereIn('academic_enrollments.student_profile_id', $profileIds)->pluck('academic_enrollments.student_profile_id');

        return $published->filter(fn ($result) => collect($result->snapshot['units'])->contains(fn ($unit) => $unit['id'] === $unitId
            && in_array($unit['status'], ['passed', 'compensated', 'recognized'], true)))
            ->pluck('student_profile_id')->merge($legacy)->unique()->values();
    }
}
