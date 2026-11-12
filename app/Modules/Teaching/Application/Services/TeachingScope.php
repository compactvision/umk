<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\Student\AcademicOffering;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class TeachingScope
{
    public static function allows(User $actor, int $faculty): bool
    {
        return ! $actor->academicFaculties()->exists() || $actor->academicFaculties()->whereKey($faculty)->exists();
    }

    public static function authorize(User $actor, int $faculty, string $permission = 'publish academic content'): void
    {
        abort_unless($actor->hasRole('admin') && $actor->can($permission) && self::allows($actor, $faculty), 403);
    }

    public static function offerings(User $actor): Builder
    {
        return AcademicOffering::query()->when($actor->academicFaculties()->exists(), fn ($query) => $query
            ->whereHas('level', fn ($levels) => $levels->whereIn('faculty_id', $actor->academicFaculties()->select('faculties.id'))));
    }
}
