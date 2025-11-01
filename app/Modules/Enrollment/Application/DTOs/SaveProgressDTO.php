<?php
// app/Modules/Enrollment/Application/DTOs/SaveProgressDTO.php

namespace App\Modules\Enrollment\Application\DTOs;

class SaveProgressDTO
{
    public function __construct(
        public readonly ?string $uuid,
        public readonly int $studentId,
        public readonly int $lastStep,
        public readonly array $formSnapshot,
    ) {}
    
    public static function fromRequest(array $data, int $studentId): self
    {
        return new self(
            uuid: $data['uuid'] ?? null,
            studentId: $studentId,
            lastStep: (int)($data['last_step'] ?? 1),
            formSnapshot: $data['form_snapshot'] ?? [],
        );
    }
}