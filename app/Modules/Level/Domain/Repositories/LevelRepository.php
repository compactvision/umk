<?php

namespace App\Modules\Level\Domain\Repositories;

use App\Modules\Level\Domain\Entities\Level;

interface LevelRepository
{
    public function save(Level $level): Level;
    public function findById(int $id): ?Level;
    public function findAll(): array;
    public function delete(int $id): void;

    public function findByCodeAndFaculty(string $code, int $facultyId): ?Level;
}
