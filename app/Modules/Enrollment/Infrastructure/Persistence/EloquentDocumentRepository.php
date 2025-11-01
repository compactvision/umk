<?php

namespace App\Modules\Enrollment\Infrastructure\Persistence;

use App\Models\EnrollmentDocument;
use App\Modules\Enrollment\Domain\Exceptions\DocumentException;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentDocumentRepository implements DocumentRepositoryInterface
{
    public function findByUuid(string $uuid): ?EnrollmentDocument
    {
        return EnrollmentDocument::where('uuid', $uuid)->first();
    }

    public function findByUuidOrFail(string $uuid): EnrollmentDocument
    {
        $document = $this->findByUuid($uuid);
        
        if (!$document) {
            throw DocumentException::notFound($uuid);
        }
        
        return $document;
    }

    public function findByEnrollment(int $enrollmentId): Collection
    {
        return EnrollmentDocument::where('enrollment_id', $enrollmentId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findByEnrollmentAndKey(int $enrollmentId, string $key): ?EnrollmentDocument
    {
        return EnrollmentDocument::where('enrollment_id', $enrollmentId)
            ->where('key', $key)
            ->latest()
            ->first();
    }

    public function save(EnrollmentDocument $document): EnrollmentDocument
    {
        $document->save();
        return $document->fresh();
    }

    public function delete(EnrollmentDocument $document): bool
    {
        return $document->delete();
    }

    public function deleteTemporaryDocuments(int $enrollmentId): int
    {
        return EnrollmentDocument::where('enrollment_id', $enrollmentId)
            ->where('is_temp', true)
            ->delete();
    }

    public function markAsPermanent(int $enrollmentId): int
    {
        return EnrollmentDocument::where('enrollment_id', $enrollmentId)
            ->where('is_temp', true)
            ->update(['is_temp' => false]);
    }
}