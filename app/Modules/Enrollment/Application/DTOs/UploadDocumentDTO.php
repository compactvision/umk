<?php

namespace App\Modules\Enrollment\Application\DTOs;

use Illuminate\Http\UploadedFile;

class UploadDocumentDTO
{
    public function __construct(
        public readonly ?string $enrollmentUuid,
        public readonly int $studentId,
        public readonly string $key,
        public readonly UploadedFile $file,
    ) {}
    
    public static function fromRequest(array $data, int $studentId): self
    {
        return new self(
            enrollmentUuid: $data['enrollment_uuid'] ?? null,
            studentId: $studentId,
            key: $data['key'],
            file: $data['file'],
        );
    }
}