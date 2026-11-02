<?php

// app/Modules/Enrollment/Domain/ValueObjects/Matricule.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class Matricule
{
    private function __construct(private string $value)
    {
        if (! preg_match('/^[A-Z0-9]{5,20}$/', $value)) {
            throw new InvalidArgumentException("Format de matricule invalide: {$value}");
        }
    }

    public static function fromString(string $matricule): self
    {
        return new self(strtoupper(trim($matricule)));
    }

    /** Code faculté + numéro d’entrée, avec au moins quatre chiffres. */
    public static function generate(string $facultyCode, int $sequence): self
    {
        $code = strtoupper(trim($facultyCode));
        if (! preg_match('/^[A-Z]{1,12}$/', $code) || $sequence < 1 || $sequence > 99999999) {
            throw new InvalidArgumentException('Le code faculté ou le numéro d’entrée est invalide.');
        }

        return new self($code.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT));
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function getYear(): ?int
    {
        return ctype_digit($this->value) ? (int) substr($this->value, 0, 4) : null;
    }

    public function getFacultyCode(): string
    {
        return preg_match('/^([A-Z]+)\d+$/', $this->value, $matches) ? $matches[1] : substr($this->value, 4, 2);
    }

    public function getSequence(): int
    {
        return preg_match('/^[A-Z]+(\d+)$/', $this->value, $matches) ? (int) $matches[1] : (int) substr($this->value, 6, 5);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
