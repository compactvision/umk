<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use DomainException;

final class OpenAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(int $id): void
    {
        $alreadyOpen = $this->repo->findOpenYear();
        if ($alreadyOpen && $alreadyOpen->id() !== $id) {
            throw new DomainException("Impossible d’ouvrir une nouvelle année, une année est déjà active.");
        }

        $year = $this->repo->findById($id);
        if (!$year) {
            throw new DomainException("Année académique introuvable.");
        }

        $year->open();
        $this->repo->save($year);
    }
}