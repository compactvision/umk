<?php

namespace App\Modules\Student\Application\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class AcademicStaffScope
{
    public static function apply(Builder $query, User $user): Builder
    {
        if ($user->academicFaculties()->exists()) {
            $query->whereHas('level', fn ($level) => $level->whereIn('faculty_id', $user->academicFaculties()->select('faculties.id')));
        }

        return $query;
    }
}
