<?php

namespace App\Modules\Newsletter\Application\DTOs;

class NewsletterSubscriberDto
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $email,
        public readonly bool $isActive = true,
        public readonly ?\DateTimeImmutable $subscribedAt = null,
        public readonly ?\DateTimeImmutable $unsubscribedAt = null
    ) {}
}
