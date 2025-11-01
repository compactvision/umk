<?php

namespace App\Modules\Enrollment\Application\DTOs;

class SubmitEnrollmentDTO
{
    public function __construct(
        public readonly string $uuid,
        public readonly int $studentId,
        public readonly ?string $notes = null,
    ) {}
    
    public static function fromRequest(string $uuid, array $data, int $studentId): self
    {
        return new self(
            uuid: $uuid,
            studentId: $studentId,
            notes: $data['notes'] ?? null,
        );
    }
}