<?php

namespace App\Modules\Enrollment\Application\UseCases;


use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepository;
use Illuminate\Support\Facades\DB;


final class ReviewEnrollment
{
    public function __construct(private EnrollmentRepository $repo) {}


    public function handle(int $enrollmentId)
    {
        return DB::transaction(function () use ($enrollmentId) {
            $enr = $this->repo->findById($enrollmentId);
            $enr->status = EnrollmentStatus::IN_REVIEW;
            $this->repo->save($enr);
            return $enr;
        });
    }
}
