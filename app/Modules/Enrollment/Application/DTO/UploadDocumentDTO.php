<?php

namespace App\Modules\Enrollment\Application\DTO;


use Illuminate\Http\UploadedFile;


final class UploadDocumentDTO
{
    public function __construct(
        public readonly int $enrollmentId,
        public readonly string $type,
        public readonly UploadedFile $file,
        public readonly int $actorId,
    ) {}
}
