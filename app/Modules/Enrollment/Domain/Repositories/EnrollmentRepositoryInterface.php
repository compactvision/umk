<?php


namespace App\Modules\Enrollment\Domain\Repositories;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use Illuminate\Support\Collection;

interface EnrollmentRepositoryInterface
{
    public function findById(int $id): ?Enrollment;

    public function findByUuid(string $uuid): ?Enrollment;

    public function findByIdOrFail(int $id): Enrollment;

    public function findByUuidOrFail(string $uuid): Enrollment;

    public function findDraftForStudent(int $studentId): ?Enrollment;

    public function findByStudent(int $studentId, ?EnrollmentStatus $status = null): Collection;

    public function save(Enrollment $enrollment): Enrollment;

    public function delete(Enrollment $enrollment): bool;

    public function generateMatricule(int $levelId, int $yearId): string;

    public function existsMatricule(string $matricule): bool;

    public function getExpiredDrafts(): Collection;
}
