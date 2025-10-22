<?php

namespace App\Policies;


use App\Models\User;
use App\Models\Enrollment;


class EnrollmentPolicy
{
    public function view(User $u, Enrollment $e): bool
    {
        return $u->id === $e->student_id || $u->hasRole('staff');
    }
    public function create(User $u): bool
    {
        return $u->hasAnyRole(['student', 'staff']);
    }
    public function review(User $u, Enrollment $e): bool
    {
        return $u->hasRole('staff');
    }
    public function download(User $u, Enrollment $e): bool
    {
        return $this->view($u, $e);
    }
}
