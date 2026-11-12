<?php

namespace App\Modules\Documents\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\User;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Illuminate\Validation\ValidationException;

final class DocumentAccess
{
    public const MANAGE = 'manage official documents';

    public const APPROVE = 'approve official documents';

    public const ISSUE = 'issue official documents';

    public const DIPLOMA = 'approve academic diplomas';

    public function staff(User $user, ?int $faculty = null, ?string $permission = null): void
    {
        abort_unless($user->hasRole('admin') && ($permission ? $user->can($permission) : $user->canAny([self::MANAGE, self::APPROVE, self::ISSUE]))
            && ($faculty === null || TeachingScope::allows($user, $faculty)), 403);
    }

    public function owner(User $user, AcademicEnrollment $entry): void
    {
        abort_unless($user->hasRole('student') && $entry->profile->user_id === $user->id, 404);
    }

    public static function check(bool $condition, string $field, string $message): void
    {
        if (! $condition) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }
}
