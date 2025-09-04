<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use App\Modules\AcademicYear\Domain\Entities\AcademicYear;

final class ListAcademicYears
{
    public function __construct(private AcademicYearRepository $repo) {}

    /**
     * Retourne toutes les années académiques
     *
     * @return AcademicYear[]
     */
    public function execute(): array
    {
        return $this->repo->all();
    }

    
}
