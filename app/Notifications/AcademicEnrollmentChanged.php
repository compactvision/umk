<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

final class AcademicEnrollmentChanged extends Notification
{
    public function __construct(private array $data) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return $this->data;
    }
}
