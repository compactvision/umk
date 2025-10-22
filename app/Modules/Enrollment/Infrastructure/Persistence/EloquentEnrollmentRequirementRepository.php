<?php

namespace App\Modules\Enrollment\Infrastructure\Persistence;


use App\Modules\Enrollment\Domain\Repositories\EnrollmentRequirementRepository;
use App\Models\EnrollmentRequirement;


final class EloquentEnrollmentRequirementRepository implements EnrollmentRequirementRepository
{
    public function create(array $data): EnrollmentRequirement
    {
        return EnrollmentRequirement::create($data);
    }
    public function findOpenByCode(int $enrollmentId, string $code): ?EnrollmentRequirement
    {
        return EnrollmentRequirement::where(compact('enrollmentId', 'code'))->where('fulfilled', false)->first();
    }
    public function close(EnrollmentRequirement $req): void
    {
        $req->fulfilled = true;
        $req->fulfilled_at = now();
        $req->save();
    }
}
