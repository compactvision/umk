<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class LearningContentNotice extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private int $enrollment, private int $course, private string $section) {}

    public function deliver(User $recipient): void
    {
        if (config('learning-content.queue_notices')) {
            $recipient->notify($this->afterCommit());
        } else {
            $recipient->notifyNow($this);
        }
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return ['academic_enrollment_id' => $this->enrollment, 'course_id' => $this->course, 'section' => $this->section, 'reference' => 'Ressources pédagogiques'];
    }
}
