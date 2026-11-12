<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;

final class CloseAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(int $id, ?int $actorId = null, string $reason = ''): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($id, $actorId, $reason) {
            if ($actorId !== null && \App\Models\User::findOrFail($actorId)->academicFaculties()->exists()) abort(403);
            \App\Models\AcademicYear::orderBy('id')->lockForUpdate()->get();
            $year = $this->repo->findById($id);
            if (! $year) {
                throw new \DomainException('Année académique introuvable.');
            }

            if ($year->status() === 'closed') {
                return;
            }
            $report = app(\App\Modules\Student\Application\Services\AnnualEnrollmentClosure::class)->report($id);
            if (!$report['can_close']) throw new \DomainException('Des inscriptions nécessitent une décision administrative avant clôture.');
            if ($report['total'] > 0 && mb_strlen(trim($reason)) < 10) throw new \DomainException('Une justification de clôture est requise.');
            $year->close();
            $this->repo->save($year);
            \App\Modules\Student\Application\Services\Audit::record($actorId, 'academic_year_closed', \App\Models\AcademicYear::findOrFail($id), $reason ?: 'Clôture d’une année sans inscription.', ['report' => $report]);
        }, 3);
    }
}
