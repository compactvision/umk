<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use DomainException;

final class OpenAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(int $id): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            \App\Models\AcademicYear::orderBy('id')->lockForUpdate()->get();
            $alreadyOpen = $this->repo->findOpenYear();
            if ($alreadyOpen && $alreadyOpen->id() !== $id) {
                throw new DomainException('Impossible d’ouvrir une nouvelle année, une année est déjà active.');
            }

            $year = $this->repo->findById($id);
            if (! $year) {
                throw new DomainException('Année académique introuvable.');
            }

            if ($year->status() === 'open') {
                return;
            }
            $year->open();
            $this->repo->save($year);
        }, 3);
    }
}
