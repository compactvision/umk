<?php

namespace App\Modules\Enrollment\Domain\Repositories;


use App\Models\Enrollment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface EnrollmentRepository
{
    public function create(array $data): Enrollment;
    public function findById(int $id): ?Enrollment;
    public function findByUuid(string $uuid): ?Enrollment;
    public function save(Enrollment $enrollment): void;
    public function paginateByStudent(
        int $studentId,
        array $filters = [],
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator;
}
