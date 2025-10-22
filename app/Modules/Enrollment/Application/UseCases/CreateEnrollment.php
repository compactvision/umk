<?php

namespace App\Modules\Enrollment\Application\UseCases;


use App\Modules\Enrollment\Application\DTO\CreateEnrollmentDTO;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepository;
use Illuminate\Support\Facades\DB;


final class CreateEnrollment
{
    public function __construct(private EnrollmentRepository $repo) {}


    public function handle(CreateEnrollmentDTO $dto)
    {
        return DB::transaction(function () use ($dto) {
            return $this->repo->create([
                'student_id' => $dto->studentId,
                'level_id' => $dto->levelId,
                'status' => EnrollmentStatus::DRAFT->value,
                'payment_status' => 'unpaid',
                'meta' => $dto->meta,
            ]);
        });
    }
}
