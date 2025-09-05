<?php

namespace App\Modules\LevelDetail\Application\UseCases;

use App\Modules\LevelDetail\Domain\Entities\LevelDetail;
use App\Modules\LevelDetail\Domain\Repositories\LevelDetailRepository;

final class GetLevelDetailByLevel
{
    public function __construct(private LevelDetailRepository $repo) {}

    public function execute(int $levelId): ?LevelDetail
    {
        return $this->repo->findByLevelId($levelId);
    }
}
