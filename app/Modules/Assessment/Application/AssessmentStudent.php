<?php

namespace App\Modules\Assessment\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\AssessmentRecord;
use Illuminate\Support\Collection;

final class AssessmentStudent
{
    public function context(Collection $resources, AcademicEnrollment $entry): array
    {
        $resources->loadMissing(['assessment', 'session', 'offering.professor']);
        $ids = $resources->pluck('assessment.id')->filter();
        $records = AssessmentRecord::where('academic_enrollment_id', $entry->id)->whereIn('academic_assessment_id', $ids)
            ->with('group')->get()->keyBy('academic_assessment_id');
        $grouped = $records->filter(fn ($row) => $row->group !== null);
        $resourceByAssessment = $resources->filter(fn ($r) => $r->assessment !== null)->keyBy('assessment.id');
        $copies = $grouped->isNotEmpty() ? AcademicSubmission::where(function ($query) use ($grouped, $resourceByAssessment) {
            foreach ($grouped as $record) {
                $query->orWhere(fn ($pair) => $pair->where('academic_resource_id', $resourceByAssessment[$record->academic_assessment_id]->id)
                    ->where('academic_enrollment_id', $record->group->leader_enrollment_id));
            }
        })->get()->keyBy('academic_resource_id') : collect();

        return [$records, $copies];
    }

    public function row(AcademicResource $resource, AcademicEnrollment $entry, ?AssessmentRecord $record, ?AcademicSubmission $submission, bool $mayParticipate, bool $mayReadResults): array
    {
        $item = $resource->assessment;
        $now = now();
        $group = $record?->group;
        $deadline = $item->accepts_until ?? $resource->closes_at;
        $canSubmit = $mayParticipate && $item->state === 'published' && ! $resource->offering->archived_at && $item->modality === 'submission'
            && (! $item->group_work || $group?->leader_enrollment_id === $entry->id)
            && (! $resource->opens_at || $resource->opens_at->lte($now)) && (! $deadline || $deadline->gte($now))
            && ($submission?->version ?? 0) < $item->attempt_limit
            && ! in_array($record?->participation, ['exempt', 'invalidated'], true);
        $released = $mayReadResults && $record?->released_at !== null;
        $status = match (true) {
            $released => 'corrected',
            $item->state === 'closed' => 'grading',
            $resource->session?->cancelled_at !== null => 'cancelled',
            $item->group_work && ! $group => 'unassigned',
            $submission !== null => 'submitted',
            $resource->opens_at?->isFuture() => 'upcoming',
            $deadline?->lt($now) => 'ended',
            default => 'available',
        };

        return [
            'category' => config('assessment.categories')[$item->category] ?? $item->category,
            'session_code' => $item->session_code, 'modality' => $item->modality,
            'teacher' => $resource->offering->professor?->full_name,
            'objectives' => $item->objectives, 'attempt_limit' => $item->attempt_limit, 'late_deadline' => $deadline,
            'maximum_points' => $item->maximum_points, 'status' => $status, 'can_submit' => $canSubmit,
            'group' => $group?->label, 'participation' => $record?->participation,
            'session' => $resource->session?->is_published ? $resource->session->only(['starts_at', 'ends_at', 'room', 'cancelled_at']) : null,
            'feedback' => $released ? [
                'points' => $record->points, 'individual' => $record->feedback, 'collective' => $group?->feedback,
                'criteria' => collect($record->criterion_points ?? [])->map(fn ($points, $index) => [
                    'label' => $item->rubric[$index]['label'], 'points' => $points, 'maximum' => $item->rubric[$index]['maximum'],
                ]),
                'file_url' => $record->feedback_path ? route('dashboard.student.assessment.feedback', ['resource' => $resource->id, 'academic' => $entry->id]) : null,
                'review_url' => $record->review_requested_revision === $record->revision ? null : route('dashboard.student.assessment.review', ['resource' => $resource->id, 'academic' => $entry->id]),
            ] : null,
        ];
    }
}
