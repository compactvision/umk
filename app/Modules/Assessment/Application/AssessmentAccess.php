<?php

namespace App\Modules\Assessment\Application;

use App\Models\Student\AcademicAssessment;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\User;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Teaching\Application\Services\LearningAccess;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Illuminate\Database\Eloquent\Builder;

final class AssessmentAccess
{
    public function __construct(private LearningAccess $staff, private AcademicAccessService $students) {}

    public function scope(User $actor): Builder
    {
        $scope = $this->staff->scope($actor);
        if ($actor->hasRole('admin') && $actor->can('publish academic content')) {
            return $scope;
        }
        abort_unless($actor->can('manage courses'), 403);
        $teacher = $this->staff->teacher($actor);

        return $scope->where(fn ($q) => $q->where('professor_id', $teacher->id)->orWhereHas('assignments', fn ($a) => $a
            ->where('professor_id', $teacher->id)->where('role', 'instructor')->whereNull('ends_at')
            ->where(fn ($time) => $time->whereNull('starts_at')->orWhere('starts_at', '<=', now()))));
    }

    public function read(User $actor, AcademicOffering $offer): void
    {
        abort_unless($this->scope($actor)->whereKey($offer->id)->exists(), 403);
    }

    public function write(User $actor, AcademicOffering $offer): void
    {
        $this->read($actor, $offer);
        abort_unless($this->staff->canManage($actor, $offer), 403);
    }

    public function validate(User $actor, AcademicOffering $offer): void
    {
        TeachingScope::authorize($actor, (int) $offer->level->faculty_id);
    }

    public static function feature(AcademicResource $resource): string
    {
        return $resource->kind === 'assignment' ? 'assignments_submit' : 'evaluations_participate';
    }

    public function canReadWork(AcademicEnrollment $entry, AcademicResource $resource): bool
    {
        return $this->students->decision($entry, 'courses_view')['allowed']
            && $this->students->offerings($entry)->whereKey($resource->academic_offering_id)->exists()
            && ($resource->student_profile_id === null || $resource->student_profile_id === $entry->student_profile_id);
    }

    public function eligible(AcademicEnrollment $entry, AcademicResource $resource): bool
    {
        return $this->students->decision($entry, self::feature($resource))['allowed'] && $this->canReadWork($entry, $resource);
    }

    public function canReadFeedback(AcademicEnrollment $entry, AcademicAssessment $assessment): bool
    {
        return $assessment->resource->is_published && $assessment->state === 'closed'
            && $this->students->decision($entry, 'results_view')['allowed'] && $this->canReadWork($entry, $assessment->resource);
    }

    public function registration(AcademicEnrollment $entry, AcademicResource $resource): ?int
    {
        return $entry->courseRegistrations()->where('academic_offering_id', $resource->academic_offering_id)
            ->whereNull('withdrawn_at')->value('id');
    }
}
