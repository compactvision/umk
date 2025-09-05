<?php

namespace App\Modules\LevelDetail\Domain\Repositories;

use App\Modules\LevelDetail\Domain\Entities\LevelDetail;

interface LevelDetailRepository
{
    public function save(LevelDetail $detail): LevelDetail;

    public function findById(int $id): ?LevelDetail;

    public function findByLevelId(int $levelId): ?LevelDetail;

    public function delete(int $id): void;
}
