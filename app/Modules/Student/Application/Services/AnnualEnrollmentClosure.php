<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;

final class AnnualEnrollmentClosure
{
    public function report(int $yearId): array
    {
        $query = AcademicEnrollment::where('academic_year_id', $yearId);
        $statuses = (clone $query)->selectRaw('enrollment_status, COUNT(*) as total')->groupBy('enrollment_status')->pluck('total', 'enrollment_status');
        $unresolved = $statuses->except(['completed', 'cancelled', 'transferred', 'withdrawn'])->sum();

        return [
            'total' => (int) $statuses->sum(), 'statuses' => $statuses, 'unresolved' => (int) $unresolved,
            'without_curriculum' => (clone $query)->whereNull('curriculum_version_id')->count(),
            'without_group' => (clone $query)->whereNull('class_id')->count(),
            'can_close' => $unresolved === 0,
        ];
    }
}
