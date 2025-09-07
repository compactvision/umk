<?php

namespace App\Modules\AdmissionCondition\Domain\Entities;

final class AdmissionCondition
{
    public function __construct(
        private ?int $id,
        private ?int $facultyId,
        private ?int $levelId,
        private string $title,
        private ?string $description,
        private string $section,
        private bool $isRequired
    ) {}

    public function getId(): ?int { return $this->id; }
    public function getFacultyId(): ?int { return $this->facultyId; }
    public function getLevelId(): ?int { return $this->levelId; }
    public function getTitle(): string { return $this->title; }
    public function getDescription(): ?string { return $this->description; }
    public function getSection(): string { return $this->section; }
    public function isRequired(): bool { return $this->isRequired; }
}
