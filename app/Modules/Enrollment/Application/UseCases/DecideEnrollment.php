<?php

namespace App\Modules\Enrollment\Application\UseCases;


use App\Modules\Enrollment\Application\DTO\DecisionDTO;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Repositories\{EnrollmentRepository, EnrollmentRequirementRepository};
use Illuminate\Support\Facades\DB;


final class DecideEnrollment
{
    public function __construct(
        private EnrollmentRepository $repo,
        private EnrollmentRequirementRepository $reqRepo,
    ) {}


    public function handle(DecisionDTO $dto)
    {
        return DB::transaction(function () use ($dto) {
            $enr = $this->repo->findById($dto->enrollmentId);
            match ($dto->decision) {
                'validated' => $enr->status = EnrollmentStatus::VALIDATED,
                'rejected' => $enr->status = EnrollmentStatus::REJECTED,
                'pending_documents' => $enr->status = EnrollmentStatus::PENDING_DOCUMENTS,
                default => throw new \InvalidArgumentException('Unknown decision'),
            };
            $enr->notes = $dto->notes;
            $this->repo->save($enr);


            if ($dto->decision === 'pending_documents' && $dto->requirements) {
                foreach ($dto->requirements as $r) {
                    $this->reqRepo->create([
                        'enrollment_id' => $enr->id,
                        'code' => $r['code'],
                        'message' => $r['message'] ?? '',
                        'deadline_at' => $r['deadline_at'] ?? null,
                    ]);
                }
            }
            return $enr;
        });
    }
}
