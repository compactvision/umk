<?php

namespace App\Modules\LevelDetail\Domain\Entities;

final class LevelDetail
{
    public function __construct(
        private ?int $id,
        private int $levelId,
        private ?float $price,
        private bool $hasCertificate,
        private ?string $language,
        private int $durationYears,
        private ?int $studentNumber,
        private ?int $creditRequired,
        private ?int $coursesNumber,
        private ?string $illustrationImage,
        private ?string $courseObjective,
        private int $fees,
        private ?array $options,
        // relations
        private ?string $levelTitle = null,
        private ?string $levelCode = null,
        private ?string $levelDescription = null,
        private ?string $facultyName = null,
        private ?string $facultyCode = null,
        private ?int $facultyId = null,
    ) {}

    public function id(): ?int { return $this->id; }
    public function levelId(): int { return $this->levelId; }
    public function price(): ?float { return $this->price; }
    public function hasCertificate(): bool { return $this->hasCertificate; }
    public function language(): ?string { return $this->language; }
    public function durationYears(): int { return $this->durationYears; }
    public function studentNumber(): ?int { return $this->studentNumber; }
    public function creditRequired(): ?int { return $this->creditRequired; }
    public function coursesNumber(): ?int { return $this->coursesNumber; }
    public function illustrationImage(): ?string { return $this->illustrationImage; }
    public function courseObjective(): ?string { return $this->courseObjective; }
    public function fees(): int { return $this->fees; }
    public function options(): ?array { return $this->options; }
    public function facultyName(): ?string { return $this->facultyName; }
    public function levelTitle(): ?string { return $this->levelTitle; }
    public function levelCode(): ?string { return $this->levelCode; }
    public function facultyCode(): ?string { return $this->facultyCode; }
    public function levelDescription(): ?string { return $this->levelDescription; }
    public function facultyId(): ?int { return $this->facultyId; }
}
