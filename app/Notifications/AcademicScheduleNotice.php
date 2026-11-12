<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class AcademicScheduleNotice extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private array $payload) {}

    public function deliver(User $recipient): void
    {
        if (config('scheduling.queue_notices')) {
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
        return $this->payload;
    }
}
