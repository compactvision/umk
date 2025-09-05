<?php

namespace App\Modules\Level\Infrastructure\Persistence;

use App\Models\Level as LevelModel;
use App\Modules\Level\Domain\Entities\Level;
use App\Modules\Level\Domain\Repositories\LevelRepository;

final class EloquentLevelRepository implements LevelRepository
{
    public function save(Level $level): Level
    {
        $model = $level->id() 
            ? LevelModel::findOrFail($level->id()) 
            : new LevelModel();

        $model->faculty_id  = $level->facultyId();
        $model->title       = $level->title();
        $model->code        = $level->code();
        $model->image       = $level->image();
        $model->tag         = $level->tag();
        $model->description = $level->description();
        $model->is_active   = $level->isActive();

        $model->save();

        return $this->mapToEntity($model);
    }

    public function findById(int $id): ?Level
    {
        $model = LevelModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findAll(): array
    {
        return LevelModel::all()->map(fn($m) => $this->mapToEntity($m))->toArray();
    }

    public function delete(int $id): void
    {
        LevelModel::destroy($id);
    }   

    public function findByCodeAndFaculty(string $code, int $facultyId): ?Level
    {
        $model = LevelModel::where('code', $code)
            ->where('faculty_id', $facultyId)
            ->first();

        return $model ? $this->mapToEntity($model) : null;
    }

    private function mapToEntity(LevelModel $model): Level
    {
        return new Level(
            $model->id,
            $model->faculty_id,
            $model->title,
            $model->code,
            $model->image,
            $model->tag,
            $model->description,
            (bool) $model->is_active
        );
    }
}
