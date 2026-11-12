<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Models\AcademicYear;
use App\Modules\AcademicStructure\Application\Services\AnnualProgramPreparation;
use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use DomainException;

final class OpenAcademicYear
{
    public function __construct(
        private AcademicYearRepository $repo,
        private AnnualProgramPreparation $preparation,
    ) {}

    public function execute(int $id, ?int $actorId = null, string $reason = ''): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($id, $actorId, $reason) {
            if ($actorId !== null && \App\Models\User::findOrFail($actorId)->academicFaculties()->exists()) abort(403);
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
            $reopening = $year->status() === 'closed';
            if ($reopening) {
                $actor = $actorId ? \App\Models\User::find($actorId) : null;
                if (!$actor?->hasRole('admin') || !$actor->can('configure settings') || mb_strlen(trim($reason)) < 10) {
                    throw new DomainException('La réouverture exige la permission de configuration et un motif explicite.');
                }
            }
            $year->open();
            $this->repo->save($year);
            if (! $reopening) {
                $this->preparation->prepareYear(AcademicYear::findOrFail($id), $actorId);
            }
            if ($reopening) \App\Modules\Student\Application\Services\Audit::record($actorId, 'academic_year_reopened', \App\Models\AcademicYear::findOrFail($id), $reason);
        }, 3);
    }
}
