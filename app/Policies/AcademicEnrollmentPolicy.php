<?php

namespace App\Policies;

use App\Models\Student\AcademicEnrollment;
use App\Models\User;

final class AcademicEnrollmentPolicy
{
    public function view(User $user, AcademicEnrollment $entry): bool
    {
        return $user->hasRole('admin')
            && $user->canAny(['manage academic access', 'manage academic finance', 'publish academic content'])
            && $this->inScope($user, $entry);
    }

    public function manage(User $user, AcademicEnrollment $entry): bool
    {
        return $user->hasRole('admin') && $user->can('manage academic access') && $this->inScope($user, $entry);
    }

    public function inScope(User $user, AcademicEnrollment $entry): bool
    {
        return ! $user->academicFaculties()->exists() || $user->academicFaculties()->whereKey($entry->level->faculty_id)->exists();
    }
}
