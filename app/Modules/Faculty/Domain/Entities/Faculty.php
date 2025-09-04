<?php

namespace App\Modules\Faculty\Domain\Entities;

final class Faculty
{
    public function __construct(
        private ?int $id,
        private string $name,
        private string $code,
        private ?string $description,
        private int $durationYears,
        private bool $isActive
    ) {}

    public function id(): ?int { return $this->id; }
    public function name(): string { return $this->name; }
    public function code(): string { return $this->code; }
    public function description(): ?string { return $this->description; }
    public function durationYears(): int { return $this->durationYears; }
    public function isActive(): bool { return $this->isActive; }

    public function updateDetails(
        string $name,
        string $code,
        ?string $description,
        int $durationYears,
        bool $isActive
    ): void {
        $this->name = $name;
        $this->code = $code;
        $this->description = $description;
        $this->durationYears = $durationYears;
        $this->isActive = $isActive;
    }
}
