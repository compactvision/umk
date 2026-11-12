<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class OfficialResultNotice extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private int $enrollment, private string $event) {}

    public function via(object $user): array
    {
        return ['database'];
    }

    public function toDatabase(object $user): array
    {
        return ['academic_enrollment_id' => $this->enrollment, 'status' => $this->event, 'reference' => 'Résultats académiques'];
    }
}
