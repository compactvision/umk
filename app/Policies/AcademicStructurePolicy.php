<?php

namespace App\Policies;

use App\Models\User;

class AcademicStructurePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') && $user->canAny(['manage academic access', 'publish academic content']);
    }

    public function manage(User $user): bool
    {
        return $user->hasRole('admin') && $user->can('manage academic access');
    }

    public function curriculum(User $user): bool
    {
        return $user->hasRole('admin') && $user->can('publish academic content');
    }
}
