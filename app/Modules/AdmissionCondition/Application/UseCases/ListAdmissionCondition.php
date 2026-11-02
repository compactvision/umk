<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

use App\Modules\AdmissionCondition\Domain\Entities\AdmissionCondition;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;

final class ListAdmissionCondition
{
    public function __construct(
        private AdmissionConditionRepository $repo
    ) {}

    /** @return AdmissionCondition[] */
    public function execute(int $facultyId, int $levelId): array
    {
        return $this->repo->findByLevelAndFaculty($facultyId, $levelId)->all();
    }
}
