<?php

namespace App\Modules\Admissions\Domain\ValueObjects;

final class StudentProfile
{
    public function __construct(
        public readonly string $firstName,
        public readonly string $lastName,
        public readonly \DateTimeImmutable $birthDate,
        public readonly string $gender,
        public readonly string $nationalId, // ex: num. carte
        public readonly string $phone,
        public readonly string $address,
        public readonly string $previousSchool,
        public readonly string $emergencyContact,
    ) {}

    public function isComplete(): bool {
        // règle simple : aucun champ vide + formats valides
        foreach (get_object_vars($this) as $v) {
            if ($v === null || $v === '') return false;
        }
        return true;
    }
}
