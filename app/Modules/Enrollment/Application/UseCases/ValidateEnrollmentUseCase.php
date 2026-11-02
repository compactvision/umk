<?php
namespace App\Modules\Enrollment\Application\UseCases;
use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
class ValidateEnrollmentUseCase
{
    public function __construct(private readonly RecordEnrollmentDecision $decisions) {}
    public function execute(int $enrollmentId, int $validatorId): Enrollment
    {
        return $this->decisions->execute($enrollmentId, $validatorId, EnrollmentStatus::VALIDATED);
    }
}
