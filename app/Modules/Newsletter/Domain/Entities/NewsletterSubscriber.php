<?php

namespace App\Modules\Newsletter\Domain\Entities;

use DateTimeImmutable;

class NewsletterSubscriber
{
    public function __construct(
        private ?int $id,
        private string $email,
        private bool $isActive,
        private ?DateTimeImmutable $subscribedAt,
        private ?DateTimeImmutable $unsubscribedAt = null
    ) {}

    public function id(): ?int
    {
        return $this->id;
    }

    public function email(): string
    {
        return $this->email;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function subscribedAt(): ?DateTimeImmutable
    {
        return $this->subscribedAt;
    }

    public function unsubscribedAt(): ?DateTimeImmutable
    {
        return $this->unsubscribedAt;
    }

    public function activate(): void
    {
        $this->isActive = true;
        $this->unsubscribedAt = null;
    }

    public function deactivate(): void
    {
        $this->isActive = false;
        $this->unsubscribedAt = new DateTimeImmutable();
    }
}
