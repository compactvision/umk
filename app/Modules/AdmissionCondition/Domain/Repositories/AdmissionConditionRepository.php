<?php

namespace App\Modules\AdmissionCondition\Domain\Repositories;

use App\Modules\AdmissionCondition\Domain\Entities\AdmissionCondition;

interface AdmissionConditionRepository
{
    public function save(AdmissionCondition $condition): AdmissionCondition;

    public function findById(int $id): ?AdmissionCondition;

    /** @return AdmissionCondition[] */
    public function findByLevel(int $levelId): array;

    /** @return AdmissionCondition[] */
    public function findByFaculty(int $facultyId): array;

    /** @return AdmissionCondition[] */
    public function findByLevelAndFaculty(int $facultyId, int $levelId): array;

    public function delete(int $id): void;
}