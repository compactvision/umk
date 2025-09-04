<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;

final class CloseAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(int $id): void
    {
        $year = $this->repo->findById($id);
        if (!$year) {
            throw new \DomainException("Année académique introuvable.");
        }

        $year->close();
        $this->repo->save($year);
    }
}
