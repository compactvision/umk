<?php

namespace App\Notifications;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicResource;
use App\Modules\Assessment\Application\AssessmentAccess;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class AcademicAssessmentNotice extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private int $entry, private int $resource, private string $kind, private string $event) {}

    public function via(object $recipient): array
    {
        return ['database'];
    }

    public function toDatabase(object $recipient): array
    {
        return ['academic_enrollment_id' => $this->entry, 'resource_id' => $this->resource,
            'section' => $this->kind === 'assignment' ? 'assignments' : 'evaluations',
            'status' => $this->event, 'reference' => 'Devoirs et évaluations'];
    }

    public function shouldSend(object $recipient, string $channel): bool
    {
        $entry = AcademicEnrollment::whereHas('profile', fn ($query) => $query->where('user_id', $recipient->id))
            ->with(['profile', 'application', 'academicYear'])->find($this->entry);
        $resource = AcademicResource::with('assessment')->find($this->resource);
        $access = app(AssessmentAccess::class);

        return $entry && $resource
            && ($this->event === 'feedback' ? $resource->assessment && $access->canReadFeedback($entry, $resource->assessment) : $access->eligible($entry, $resource))
            && ! $recipient->notifications()->whereKey($this->id)->exists();
    }
}
