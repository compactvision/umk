<?php

namespace App\Modules\Enrollment\Domain\Repositories;


use App\Models\EnrollmentDocument;


interface EnrollmentDocumentRepository
{
    public function create(array $data): EnrollmentDocument;
    public function findByUuid(string $uuid): ?EnrollmentDocument;
    public function save(EnrollmentDocument $doc): void;
}
