<?php

namespace App\Modules\Admissions\Infrastructure\Persistence;

use App\Modules\Admissions\Domain\Entities\Student;
use App\Modules\Admissions\Domain\Repositories\StudentRepository;

final class EloquentStudentRepository implements StudentRepository
{
    public function byUserId(int $userId): ?Student { /* map Eloquent ↔ Domain */ }
    public function save(Student $student): void { /* persist + mapping */ }
}
