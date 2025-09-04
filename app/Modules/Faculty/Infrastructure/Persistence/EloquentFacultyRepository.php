<?php

namespace App\Modules\Faculty\Infrastructure\Persistence;

use App\Models\Faculty as FacultyModel;
use App\Modules\Faculty\Domain\Entities\Faculty;
use App\Modules\Faculty\Domain\Repositories\FacultyRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;


final class EloquentFacultyRepository implements FacultyRepository
{
    public function save(Faculty $faculty): Faculty
    {
        $model = $faculty->id()
            ? FacultyModel::findOrFail($faculty->id())
            : new FacultyModel();

        $model->name = $faculty->name();
        $model->code = $faculty->code();
        $model->description = $faculty->description();
        $model->duration_years = $faculty->durationYears();
        $model->is_active = $faculty->isActive();

        $model->save();

        return $this->mapToEntity($model);
    }

    public function findById(int $id): ?Faculty
    {
        $model = FacultyModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findByName(string $name): ?Faculty
    {
        $model = FacultyModel::where('name', $name)->first();
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findByCode(string $code): ?Faculty
    {
        $model = FacultyModel::where('code', $code)->first();
        return $model ? $this->mapToEntity($model) : null;
    }

    public function paginate(int $perPage = 10): LengthAwarePaginator
    {
        return FacultyModel::with('levels')->paginate($perPage);
    }

    public function delete(Faculty $faculty): void
    {
        $model = FacultyModel::find($faculty->id());

        if ($model) {
            $model->delete();
        }
    }

    private function mapToEntity(FacultyModel $model): Faculty
    {
        return new Faculty(
            $model->id,
            $model->name,
            $model->code,
            $model->description,
            $model->duration_years,
            (bool) $model->is_active
        );
    }
}
