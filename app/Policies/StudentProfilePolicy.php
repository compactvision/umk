<?php

namespace App\Policies;

use App\Models\Student\StudentProfile;
use App\Models\User;

final class StudentProfilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') && $user->canAny(['manage academic access', 'manage academic finance', 'publish academic content']);
    }

    public function view(User $user, StudentProfile $profile): bool
    {
        return $this->viewAny($user) && $this->inScope($user, $profile);
    }

    private function inScope(User $user, StudentProfile $profile): bool
    {
        return ! $user->academicFaculties()->exists() || $profile->enrollments()->whereHas('level', fn ($level) => $level->whereIn('faculty_id', $user->academicFaculties()->select('faculties.id')))->exists();
    }

    public function manageAccount(User $user, StudentProfile $profile): bool
    {
        return $user->hasRole('admin') && $user->can('manage academic access') && $user->can('manage users') && $this->inScope($user, $profile);
    }
}
