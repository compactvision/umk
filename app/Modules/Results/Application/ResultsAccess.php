<?php

namespace App\Modules\Results\Application;

use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\Student\AcademicDeliberation;
use App\Models\User;
use App\Modules\Teaching\Application\Services\TeachingScope;

final class ResultsAccess
{
    public const MANAGE = 'manage academic results';

    public const JURY = 'deliberate academic results';

    public const PUBLISH = 'publish official results';

    public function faculty(CurriculumVersion $version): int
    {
        return (int) ($version->program_snapshot['faculty_id'] ?? $version->program->faculty_id);
    }

    public function staff(User $user, ?int $faculty = null, ?string $permission = null): void
    {
        abort_unless($user->hasRole('admin') && ($permission ? $user->can($permission) : $user->canAny([self::MANAGE, self::JURY, self::PUBLISH]))
            && ($faculty === null || TeachingScope::allows($user, $faculty)), 403);
    }

    public function jury(User $user, AcademicDeliberation $run, bool $chair = false): void
    {
        $this->staff($user, $run->context['faculty_id'], self::JURY);
        abort_unless($chair ? $run->jury['chair'] === $user->id : in_array($user->id, $run->attendance ?? [], true), 403);
    }
}
