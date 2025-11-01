<?php
// app/Modules/Enrollment/Domain/ValueObjects/StudentEmail.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class StudentEmail
{
    private function __construct(private string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Email invalide: {$value}");
        }
    }

    public static function fromString(string $email): self
    {
        return new self(trim(strtolower($email)));
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function getDomain(): string
    {
        return substr($this->value, strpos($this->value, '@') + 1);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}