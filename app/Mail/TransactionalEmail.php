<?php

namespace App\Mail;

use Illuminate\Notifications\Messages\MailMessage;

final class TransactionalEmail
{
    public static function recipientName(object $recipient): string
    {
        return trim(($recipient->first_name ?? '').' '.($recipient->last_name ?? '')) ?: 'Madame, Monsieur';
    }

    public static function notification(array $data): MailMessage
    {
        return (new MailMessage)
            ->from(config('mail.from.address'), 'Université Simon Kimbangu')
            ->subject($data['subject'])
            ->view(['html' => 'emails.transactional', 'text' => 'emails.transactional-text'], $data);
    }
}
