<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\EnrollmentNotFoundException;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use Carbon\Carbon;

class ValidateEnrollmentUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $repository
    ) {}

    public function execute(int $enrollmentId, int $validatorId): Enrollment
    {
        $enrollment = $this->repository->findById($enrollmentId);
        
        if (!$enrollment) {
            throw EnrollmentNotFoundException::withId($enrollmentId);
        }

        $enrollment->status = EnrollmentStatus::VALIDATED->value;
        $enrollment->enrolled_at = Carbon::now();
        
        // Ajouter l'info du validateur dans meta
        $meta = $enrollment->meta ?? [];
        $meta['validated_by'] = $validatorId;
        $meta['validated_at'] = Carbon::now()->toISOString();
        $enrollment->meta = $meta;

        return $this->repository->save($enrollment);
    }
}