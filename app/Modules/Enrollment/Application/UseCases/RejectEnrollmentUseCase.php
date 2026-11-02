<?php
namespace App\Modules\Enrollment\Application\UseCases;
use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
class RejectEnrollmentUseCase
{
    public function __construct(private readonly RecordEnrollmentDecision $decisions) {}
    public function execute(int $enrollmentId, int $validatorId, string $reason): Enrollment
    {
        return $this->decisions->execute($enrollmentId, $validatorId, EnrollmentStatus::REJECTED, $reason);
    }
}
