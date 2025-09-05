<?php

namespace App\Modules\Level\Domain\Entities;

final class Level
{
    public function __construct(
        private ?int $id,
        private int $facultyId,
        private string $title,
        private string $code,
        private ?string $image,
        private ?string $tag,
        private ?string $description,
        private bool $isActive = true
    ) {}

    public function id(): ?int { return $this->id; }
    public function facultyId(): int { return $this->facultyId; }
    public function title(): string { return $this->title; }
    public function code(): string { return $this->code; }
    public function image(): ?string { return $this->image; }
    public function tag(): ?string { return $this->tag; }
    public function description(): ?string { return $this->description; }
    public function isActive(): bool { return $this->isActive; }
}
