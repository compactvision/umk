<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\EnrollmentNotFoundException;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use Carbon\Carbon;

class RejectEnrollmentUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $repository
    ) {}

    public function execute(int $enrollmentId, int $validatorId, string $reason): Enrollment
    {
        $enrollment = $this->repository->findById($enrollmentId);
        
        if (!$enrollment) {
            throw EnrollmentNotFoundException::withId($enrollmentId);
        }

        $enrollment->status = EnrollmentStatus::REJECTED->value;
        $enrollment->notes = $reason;
        
        // Ajouter l'info du rejet dans meta
        $meta = $enrollment->meta ?? [];
        $meta['rejected_by'] = $validatorId;
        $meta['rejected_at'] = Carbon::now()->toISOString();
        $meta['rejection_reason'] = $reason;
        $enrollment->meta = $meta;

        return $this->repository->save($enrollment);
    }
}