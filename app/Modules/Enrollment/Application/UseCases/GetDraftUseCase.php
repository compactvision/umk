<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;

class GetDraftUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $repository
    ) {}

    public function execute(int $studentId): ?Enrollment
    {
        return $this->repository->findDraftForStudent($studentId);
    }
}