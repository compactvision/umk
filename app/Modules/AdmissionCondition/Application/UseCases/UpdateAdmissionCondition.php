<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

use App\Modules\AdmissionCondition\Domain\Entities\AdmissionCondition;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;

class UpdateAdmissionCondition
{
    public function __construct(
        private AdmissionConditionRepository $repo
    ) {}

    public function execute(
        int $id,
        ?int $facultyId,
        ?int $levelId,
        string $title,
        ?string $description,
        string $section,
        bool $isRequired
    ): AdmissionCondition {
        $condition = $this->repo->findById($id);

        if (!$condition) {
            throw new \DomainException("La condition avec l'ID {$id} n'existe pas.");
        }

        $updateConditon = new AdmissionCondition(
            $id,
            $facultyId,
            $levelId,
            $title,
            $description,
            $section,
            $isRequired
        );

        return $this->repo->save($updateConditon);
    }
}
