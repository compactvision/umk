<?php

namespace App\Modules\LevelDetail\Infrastructure\Persistence;

use App\Modules\LevelDetail\Domain\Entities\LevelDetail;
use App\Modules\LevelDetail\Domain\Repositories\LevelDetailRepository;
use App\Models\LevelDetail as LevelDetailModel;

final class EloquentLevelDetailRepository implements LevelDetailRepository
{
    public function save(LevelDetail $detail): LevelDetail
    {
        $model = $detail->id()
            ? LevelDetailModel::findOrFail($detail->id())
            : new LevelDetailModel();

        $model->level_id          = $detail->levelId();
        $model->price             = $detail->price();
        $model->has_certificate   = $detail->hasCertificate();
        $model->language          = $detail->language();
        $model->duration_years    = $detail->durationYears();
        $model->student_number    = $detail->studentNumber();
        $model->credit_required   = $detail->creditRequired();
        $model->courses_number    = $detail->coursesNumber();
        $model->illustration_image = $detail->illustrationImage();
        $model->course_objective  = $detail->courseObjective();
        $model->fees              = $detail->fees();
        $model->options           = $detail->options();

        $model->save();

        return $this->mapToEntity($model);
    }

    public function findById(int $id): ?LevelDetail
    {
        $model = LevelDetailModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findByLevelId(int $levelId): ?LevelDetail
{
    $model = LevelDetailModel::with(['level.faculty'])
        ->firstOrCreate(
            ['level_id' => $levelId],
            [
                'price' => 0,
                'has_certificate' => false,
                'language' => null,
                'duration_years' => 1,
                'student_number' => 0,
                'credit_required' => null,
                'courses_number' => 0,
                'illustration_image' => null,
                'course_objective' => null,
                'fees' => 0,
                'options' => null,
            ]
        );

    return $this->mapToEntity($model);
}


    public function delete(int $id): void
    {
        LevelDetailModel::destroy($id);
    }

    private function mapToEntity(LevelDetailModel $model): LevelDetail
{
    return new LevelDetail(
        $model->id,
        $model->level_id,
        $model->price,
        (bool) $model->has_certificate,
        $model->language,
        $model->duration_years,
        $model->student_number,
        $model->credit_required,
        $model->courses_number,
        $model->illustration_image,
        $model->course_objective,
        $model->fees,
        $model->options ? json_decode($model->options, true) : [],
        // Relations
        $model->level?->title,
        $model->level?->code,
        $model->level?->faculty?->name,
        $model->level?->faculty?->code,
    );
}

}
