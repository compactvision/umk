<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class OfficialDocumentNotice extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private int $enrollment, private string $event, private string $section) {}

    public function via(object $recipient): array
    {
        return ['database'];
    }

    public function shouldSend(object $recipient, string $channel): bool
    {
        return ! $recipient->notifications()->whereKey($this->id)->exists();
    }

    public function toDatabase(object $recipient): array
    {
        return ['academic_enrollment_id' => $this->enrollment, 'status' => $this->event, 'section' => $this->section, 'reference' => 'Documents officiels'];
    }
}
