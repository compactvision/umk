<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;

final class CloseAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(int $id): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            \App\Models\AcademicYear::orderBy('id')->lockForUpdate()->get();
            $year = $this->repo->findById($id);
            if (! $year) {
                throw new \DomainException('Année académique introuvable.');
            }

            if ($year->status() === 'closed') {
                return;
            }
            $year->close();
            $this->repo->save($year);
        }, 3);
    }
}
