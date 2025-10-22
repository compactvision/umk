<?php

namespace App\Modules\Enrollment\Application\DTO;


final class CreateEnrollmentDTO
{
    public function __construct(
        public readonly int $studentId,
        public readonly int $levelId,
        public readonly ?array $meta = null,
    ) {}
}
