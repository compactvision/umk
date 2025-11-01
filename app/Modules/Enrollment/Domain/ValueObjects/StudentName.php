<?php
// app/Modules/Enrollment/Domain/ValueObjects/StudentName.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class StudentName
{
    private function __construct(private string $value)
    {
        $trimmed = trim($value);
        if (strlen($trimmed) < 2) {
            throw new InvalidArgumentException("Le nom doit contenir au moins 2 caractères");
        }
        if (strlen($trimmed) > 255) {
            throw new InvalidArgumentException("Le nom est trop long (max 255 caractères)");
        }
    }

    public static function fromString(string $name): self
    {
        return new self($name);
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function toUpperCase(): string
    {
        return strtoupper($this->value);
    }

    public function getInitials(): string
    {
        $parts = explode(' ', $this->value);
        $initials = '';
        foreach ($parts as $part) {
            if (!empty($part)) {
                $initials .= strtoupper($part[0]);
            }
        }
        return $initials;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}