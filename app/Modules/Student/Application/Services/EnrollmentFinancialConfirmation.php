<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;

final class EnrollmentFinancialConfirmation
{
    public function apply(AcademicEnrollment $entry, ?int $actorId, bool $covered): void
    {
        if (! config('student.enrollment_auto_confirmation') || ! config('student.enrollment_requires_first_installment') || ! $covered
            || $entry->enrollment_status !== 'pending_confirmation' || $entry->academicYear->status !== 'open'
            || $entry->profile->student_status !== 'active' || $entry->application?->status?->value !== 'validated') {
            return;
        }
        $entry->update(['enrollment_status' => 'confirmed']);
        Audit::record($actorId, 'academic_enrollment_confirmed', $entry, 'Première tranche des frais académiques entièrement couverte.');
    }
}
