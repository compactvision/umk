<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Entities\AcademicYear;
use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use App\Modules\AcademicYear\Domain\Exceptions\AcademicYearNotFoundException;

final class UpdateAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(
        int $id,
        string $title,
        \DateTimeImmutable $startDate,
        \DateTimeImmutable $endDate
    ): AcademicYear {
        $year = $this->repo->findById($id);

        if (!$year) {
            throw new AcademicYearNotFoundException("Année académique introuvable.");
        }

        $year->update($title, $startDate, $endDate);

        return $this->repo->save($year);
    }
}
