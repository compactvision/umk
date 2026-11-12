<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\EnrollmentChange;

final class EnrollmentMembershipHistory
{
    private \WeakMap $segments;

    public function __construct()
    {
        $this->segments = new \WeakMap;
    }

    /** Membership at the start of each session; resource access still uses the current context. */
    public function segments(AcademicEnrollment $entry): array
    {
        if (isset($this->segments[$entry])) {
            return $this->segments[$entry];
        }
        $started = EnrollmentChange::where('target_enrollment_id', $entry->id)->where('action', 'transfer')->min('effective_at');
        $changes = $entry->changes()->where('action', 'transition')->orderBy('effective_at')->orderBy('id')
            ->get(['before', 'after', 'effective_at'])->filter(fn ($change) => $this->membership($change->before) !== $this->membership($change->after))->values();
        if ($changes->isEmpty()) {
            return $this->segments[$entry] = [['from' => $started, 'until' => null] + $this->membership($entry->getAttributes())];
        }
        $segments = [['from' => $started, 'until' => $changes->first()->effective_at] + $this->membership($changes->first()->before)];
        foreach ($changes as $index => $change) {
            $segments[] = ['from' => $change->effective_at, 'until' => $changes->get($index + 1)?->effective_at] + $this->membership($change->after);
        }

        return $this->segments[$entry] = $segments;
    }

    private function membership(array $data): array
    {
        return ['class_id' => isset($data['class_id']) ? (int) $data['class_id'] : null,
            'academic_department_id' => isset($data['academic_department_id']) ? (int) $data['academic_department_id'] : null];
    }
}
