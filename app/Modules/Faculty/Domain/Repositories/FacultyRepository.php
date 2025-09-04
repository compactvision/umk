<?php

namespace App\Modules\Faculty\Domain\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Modules\Faculty\Domain\Entities\Faculty;

interface FacultyRepository
{
    public function save(Faculty $faculty): Faculty;

    public function findById(int $id): ?Faculty;

    public function delete(Faculty $faculty): void;

    public function findByName(string $name): ?Faculty;
    public function findByCode(string $code): ?Faculty;

    public function paginate(int $perPage = 10): LengthAwarePaginator;
}
