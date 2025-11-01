<?php
// app/Modules/Enrollment/Domain/ValueObjects/EnrollmentId.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class EnrollmentId
{
    private function __construct(private int $value)
    {
        if ($value <= 0) {
            throw new InvalidArgumentException("ID d'inscription invalide");
        }
    }

    public static function fromInt(int $value): self
    {
        return new self($value);
    }

    public function toInt(): int
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return (string) $this->value;
    }
}