<?php

namespace App\Modules\Enrollment\Infrastructure\Persistence;


use App\Modules\Enrollment\Domain\Repositories\EnrollmentDocumentRepository;
use App\Models\EnrollmentDocument;


final class EloquentEnrollmentDocumentRepository implements EnrollmentDocumentRepository
{
    public function create(array $data): EnrollmentDocument
    {
        return EnrollmentDocument::create($data);
    }
    public function findByUuid(string $uuid): ?EnrollmentDocument
    {
        return EnrollmentDocument::where('uuid', $uuid)->first();
    }
    public function save(EnrollmentDocument $d): void
    {
        $d->save();
    }
}
