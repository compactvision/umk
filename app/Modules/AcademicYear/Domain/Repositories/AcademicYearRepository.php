<?php

namespace App\Modules\AcademicYear\Domain\Repositories;

use App\Modules\AcademicYear\Domain\Entities\AcademicYear;

interface AcademicYearRepository
{
    public function save(AcademicYear $year): AcademicYear;

    public function findById(int $id): ?AcademicYear;

    public function findOpenYear(): ?AcademicYear;

    /** @return AcademicYear[] */
    public function all(): array;
}
