<?php

namespace App\Modules\AcademicYear\Domain\Entities;

use DateTimeImmutable;

final class AcademicYear
{
    public function __construct(
        private ?int $id,
        private string $title,
        private DateTimeImmutable $startDate,
        private DateTimeImmutable $endDate,
        private string $status = 'draft', // draft | open | closed
        private ?\DateTimeImmutable $createdAt = null,
        private ?\DateTimeImmutable $updatedAt = null,
    ) {}

    public static function create(string $title, DateTimeImmutable $start, DateTimeImmutable $end): self
    {
        return new self(null, $title, $start, $end, 'draft');
    }

    public function update(string $title, \DateTimeImmutable $startDate, \DateTimeImmutable $endDate): void
    {
        $this->title = $title;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function open(): void
    {
        if ($this->status === 'open') {
            throw new \DomainException("L'année est déjà ouverte");
        }
        $this->status = 'open';
    }

    public function close(): void
    {
        if ($this->status === 'closed') {
            throw new \DomainException("L'année est déjà clôturée");
        }
        $this->status = 'closed';
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function title(): string { return $this->title; }
    public function startDate(): DateTimeImmutable { return $this->startDate; }
    public function endDate(): DateTimeImmutable { return $this->endDate; }
    public function status(): string { return $this->status; }
    public function createdAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}
