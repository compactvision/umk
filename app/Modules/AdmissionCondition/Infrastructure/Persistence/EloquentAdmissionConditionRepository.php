<?php

namespace App\Modules\AdmissionCondition\Infrastructure\Persistence;

use App\Modules\AdmissionCondition\Domain\Entities\AdmissionCondition;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;
use App\Models\AdmissionCondition as AdmissionConditionModel;


class EloquentAdmissionConditionRepository implements AdmissionConditionRepository
{
    public function save(AdmissionCondition $condition): AdmissionCondition
    {
        $model = AdmissionConditionModel::updateOrCreate(
            ['id' => $condition->getId()],
            [
                'faculty_id'  => $condition->getFacultyId(),
                'level_id'    => $condition->getLevelId(),
                'title'       => $condition->getTitle(),
                'description' => $condition->getDescription(),
                'section'     => $condition->getSection(),
                'is_required' => $condition->isRequired(),
            ]
        );

        return $this->mapToEntity($model);
    }

    public function findById(int $id): ?AdmissionCondition
    {
        $model = AdmissionConditionModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findByLevel(int $levelId): array
    {
        return AdmissionConditionModel::where('level_id', $levelId)
            ->get()
            ->map(fn ($m) => $this->mapToEntity($m))
            ->all();
    }

    public function findByFaculty(int $facultyId): array
    {
        return AdmissionConditionModel::where('faculty_id', $facultyId)
            ->get()
            ->map(fn ($m) => $this->mapToEntity($m))
            ->all();
    }

    public function delete(int $id): void
    {
        AdmissionConditionModel::destroy($id);
    }

    public function findByLevelAndFaculty(int $facultyId, int $levelId): array
    {
        return AdmissionConditionModel::where('faculty_id', $facultyId)
            ->where('level_id', $levelId)
            ->get()
            ->map(fn ($m) => $this->mapToEntity($m))
            ->all();
    }

    private function mapToEntity(AdmissionConditionModel $model): AdmissionCondition
    {
        return new AdmissionCondition(
            $model->id,
            $model->faculty_id,
            $model->level_id,
            $model->title,
            $model->description,
            $model->section,
            $model->is_required
        );
    }
}
