<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;

class DeleteAdmissionCondition
{
    public function __construct(
        private AdmissionConditionRepository $repo
    ) {}

    public function execute(int $id): void
    {
        $this->repo->delete($id);
    }
}
