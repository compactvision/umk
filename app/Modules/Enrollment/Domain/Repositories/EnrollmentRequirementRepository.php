<?php

namespace App\Modules\Enrollment\Domain\Repositories;


use App\Models\EnrollmentRequirement;


interface EnrollmentRequirementRepository
{
    public function create(array $data): EnrollmentRequirement;
    public function findOpenByCode(int $enrollmentId, string $code): ?EnrollmentRequirement;
    public function close(EnrollmentRequirement $req): void;
}
