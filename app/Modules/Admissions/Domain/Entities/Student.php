<?php

namespace App\Modules\Admissions\Domain\Entities;

use App\Modules\Admissions\Domain\ValueObjects\StudentNumber;
use App\Modules\Admissions\Domain\ValueObjects\StudentProfile;

final class Student
{
    public function __construct(
        private ?int $id,
        private int $userId,
        private ?StudentProfile $profile,
        private ?StudentNumber $studentNumber,
    ) {}

    public static function fromUser(int $userId): self {
        return new self(null, $userId, null, null);
    }

    public function attachProfile(StudentProfile $profile): void {
        $this->profile = $profile;
    }

    public function canAccessEnrollment(): bool {
        return $this->profile?->isComplete() === true;
    }

    // getters...
}
