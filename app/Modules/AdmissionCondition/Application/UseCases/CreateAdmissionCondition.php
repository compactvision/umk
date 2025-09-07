<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

use App\Modules\AdmissionCondition\Domain\Entities\AdmissionCondition;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;

final class CreateAdmissionCondition
{
    public function __construct(
        private AdmissionConditionRepository $repo
    ) {}

    public function execute(
        ?int $facultyId,
        ?int $levelId,
        string $title,
        ?string $description,
        string $section,
        bool $isRequired
    ): AdmissionCondition {
        $condition = new AdmissionCondition(
            null,
            $facultyId,
            $levelId,
            $title,
            $description,
            $section,
            $isRequired
        );

        return $this->repo->save($condition);
    }
}
