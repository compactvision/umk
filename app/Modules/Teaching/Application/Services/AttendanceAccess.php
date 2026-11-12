<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\Professor;
use App\Models\Student\AcademicSession;
use App\Models\User;

final class AttendanceAccess
{
    public function authorize(User $actor, AcademicSession $session): void
    {
        $offer = $session->offering;
        if ($actor->hasRole('admin')) {
            TeachingScope::authorize($actor, (int) $offer->level->faculty_id);

            return;
        }
        abort_unless($actor->hasRole('professor') && $actor->can('manage students'), 403);
        $teacher = Professor::where('user_id', $actor->id)->where('is_active', true)->first();
        abort_unless($teacher && $session->is_published && $offer->is_published
            && in_array($teacher->id, TeachingTeam::idsAt($offer, $session->starts_at)), 403);
        abort_unless((int) $offer->professor_id === $teacher->id
            || $offer->assignments()->where('professor_id', $teacher->id)->where('role', 'instructor')->whereNull('ends_at')
                ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $session->starts_at))->exists(), 403);
    }
}
