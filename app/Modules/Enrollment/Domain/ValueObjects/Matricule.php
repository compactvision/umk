<?php
// app/Modules/Enrollment/Domain/ValueObjects/Matricule.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class Matricule
{
    private function __construct(private string $value)
    {
        if (!preg_match('/^[A-Z0-9]{6,20}$/', $value)) {
            throw new InvalidArgumentException("Format de matricule invalide: {$value}");
        }
    }

    public static function fromString(string $matricule): self
    {
        return new self(strtoupper(trim($matricule)));
    }

    /**
     * Génère un matricule au format: YYYYFFNNNNN
     * YYYY = année (4 chiffres)
     * FF = faculté (2 chiffres)
     * NNNNN = séquence (5 chiffres)
     */
    public static function generate(int $year, int $facultyId, int $sequence): self
    {
        $matricule = sprintf('%d%02d%05d', $year, $facultyId, $sequence);
        return new self($matricule);
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function getYear(): int
    {
        return (int) substr($this->value, 0, 4);
    }

    public function getFacultyCode(): int
    {
        return (int) substr($this->value, 4, 2);
    }

    public function getSequence(): int
    {
        return (int) substr($this->value, 6, 5);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}