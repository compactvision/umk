<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\Professor;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicSession;
use App\Models\User;
use App\Notifications\AcademicScheduleNotice;

final class ScheduleNotices
{
    public function session(AcademicSession $session, string $event, ?AcademicSession $previous = null): void
    {
        $offering = $session->offering;
        if (! $offering->is_published) {
            return;
        }
        $audience = app(CourseAudience::class);
        $entries = $audience->roster($offering, $session->starts_at)->select('academic_enrollments.id');
        $payload = ['status' => $event, 'reference' => $offering->curriculumItem?->name ?? $offering->course->title,
            'session_id' => $session->id, 'offering_id' => $offering->id, 'week' => $session->starts_at->copy()->timezone('Africa/Kinshasa')->startOfWeek()->toDateString()];
        AcademicEnrollment::query()->where(fn ($query) => $query->whereIn('id', $entries)
            ->when($previous, fn ($q) => $q->orWhereIn('id', $audience->roster($previous->offering, $previous->starts_at)->select('academic_enrollments.id'))))
            ->with('profile.user')->chunkById(150, function ($rows) use ($payload) {
                foreach ($rows as $entry) {
                    (new AcademicScheduleNotice($payload + ['academic_enrollment_id' => $entry->id]))->deliver($entry->profile->user);
                }
            });
        $teachers = TeachingTeam::idsAt($offering, $session->starts_at);
        if ($previous) {
            $teachers = array_unique([...$teachers, ...TeachingTeam::idsAt($previous->offering, $previous->starts_at)]);
        }
        User::whereIn('id', Professor::whereIn('id', $teachers)->where('is_active', true)->select('user_id'))->eachById(
            fn ($teacher) => (new AcademicScheduleNotice($payload))->deliver($teacher)
        );
    }
}
