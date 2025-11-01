<?php


namespace App\Modules\Enrollment\Domain\Repositories;

use App\Models\EnrollmentDocument;
use Illuminate\Support\Collection;

interface DocumentRepositoryInterface
{
    public function findByUuid(string $uuid): ?EnrollmentDocument;

    public function findByUuidOrFail(string $uuid): EnrollmentDocument;

    public function findByEnrollment(int $enrollmentId): Collection;

    public function findByEnrollmentAndKey(int $enrollmentId, string $key): ?EnrollmentDocument;

    public function save(EnrollmentDocument $document): EnrollmentDocument;

    public function delete(EnrollmentDocument $document): bool;

    public function deleteTemporaryDocuments(int $enrollmentId): int;

    public function markAsPermanent(int $enrollmentId): int;
}
