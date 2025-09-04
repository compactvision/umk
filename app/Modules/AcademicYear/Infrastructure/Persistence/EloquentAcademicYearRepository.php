<?php

namespace App\Modules\AcademicYear\Infrastructure\Persistence;

use App\Models\AcademicYear as AcademicYearModel;
use App\Modules\AcademicYear\Domain\Entities\AcademicYear;
use App\Modules\AcademicYear\Domain\Exceptions\DuplicateAcademicYearException;
use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use Illuminate\Database\QueryException;

final class EloquentAcademicYearRepository implements AcademicYearRepository
{
    public function save(AcademicYear $year): AcademicYear
    {
        try {
            $model = $year->id()
                ? AcademicYearModel::findOrFail($year->id())
                : new AcademicYearModel();
    
            $model->title = $year->title();
            $model->start_date = $year->startDate()->format('Y-m-d');
            $model->end_date = $year->endDate()->format('Y-m-d');
            $model->status = $year->status();
            $model->save();
    
            return $this->mapToEntity($model);
        } catch (QueryException $e) {
            if ($e->getCode() === "23000") { // Contrainte d’unicité MySQL
                throw new DuplicateAcademicYearException($year->title());
            }
            throw $e; // Autres erreurs DB
        }
    }

    public function findById(int $id): ?AcademicYear
    {
        $model = AcademicYearModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findOpenYear(): ?AcademicYear
    {
        $model = AcademicYearModel::where('status', 'open')->first();
        return $model ? $this->mapToEntity($model) : null;
    }

    public function all(): array
    {
        return AcademicYearModel::all()
            ->map(fn ($model) => $this->mapToEntity($model))
            ->toArray();
    }


    private function mapToEntity(AcademicYearModel $model): AcademicYear
    {
        return new AcademicYear(
            $model->id,
            $model->title,
            new \DateTimeImmutable($model->start_date),
            new \DateTimeImmutable($model->end_date),
            $model->status,
            $model->created_at ? new \DateTimeImmutable($model->created_at) : null,
            $model->updated_at ? new \DateTimeImmutable($model->updated_at) : null
        );
    }
}
