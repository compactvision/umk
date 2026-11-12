<?php

namespace App\Modules\AdmissionCondition\Infrastructure\Persistence;

use App\Models\AdmissionCondition as AdmissionConditionModel;
use App\Modules\AdmissionCondition\Domain\Entities\AdmissionCondition;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;
use Illuminate\Support\Collection;

class EloquentAdmissionConditionRepository implements AdmissionConditionRepository
{
    public function save(AdmissionCondition $condition): AdmissionCondition
    {
        $model = AdmissionConditionModel::updateOrCreate(
            ['id' => $condition->getId()],
            [
                'faculty_id' => $condition->getFacultyId(),
                'level_id' => $condition->getLevelId(),
                'title' => $condition->getTitle(),
                'description' => $condition->getDescription(),
                'section' => $condition->getSection(),
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

    public function findByLevelAndFaculty(int $facultyId, int $levelId): Collection
    {
        $q = AdmissionConditionModel::query()
            ->where(fn ($query) => $query
                ->where(fn ($level) => $level->where('level_id', $levelId)->where(fn ($owner) => $owner->where('faculty_id', $facultyId)->orWhereNull('faculty_id')))
                ->orWhere(fn ($faculty) => $faculty->whereNull('level_id')->where('faculty_id', $facultyId)))
            ->orderByRaw("CASE section
                WHEN 'personal_info' THEN 1
                WHEN 'academic_info' THEN 2
                ELSE 3
            END")
            ->orderBy('id');

        return $q->get()->map(fn ($m) => $this->mapToEntity($m));
    }

    private function mapToEntity(AdmissionConditionModel $m): AdmissionCondition
    {
        return new AdmissionCondition(
            id: $m->id,
            facultyId: $m->faculty_id,
            levelId: $m->level_id,
            title: $m->title,
            description: $m->description,
            section: $m->section,     // 'personal_info' | 'academic_info' | ...
            isRequired: (bool) $m->is_required
        );
    }
}
