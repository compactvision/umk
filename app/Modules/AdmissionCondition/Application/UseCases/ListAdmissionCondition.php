<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

use App\Models\AdmissionCondition;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;

final class ListAdmissionCondition
{
    public function __construct(
        private AdmissionConditionRepository $repo
    ) {}

    public function execute(int $facultyId, int $levelId): array
    {
        return $this->repo->findByLevelAndFaculty($facultyId, $levelId);
    }
}
