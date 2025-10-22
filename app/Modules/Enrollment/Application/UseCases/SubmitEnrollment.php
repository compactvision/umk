<?php

namespace App\Modules\Enrollment\Application\UseCases;


use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepository;
use App\Modules\Enrollment\Domain\Services\RequiredDocumentProvider;
use App\Modules\Enrollment\Domain\Specs\AdmissionSpec;
use Illuminate\Support\Facades\DB;
use RuntimeException;


final class SubmitEnrollment
{
    public function __construct(
        private EnrollmentRepository $repo,
        private RequiredDocumentProvider $provider,
    ) {}


    public function handle(int $enrollmentId)
    {
        return DB::transaction(function () use ($enrollmentId) {
            $enr = $this->repo->findById($enrollmentId);
            if (!$enr) throw new RuntimeException('Enrollment not found');
            if (!AdmissionSpec::canSubmit($enr, $this->provider)) {
                throw new RuntimeException('Required documents missing');
            }
            $enr->status = EnrollmentStatus::SUBMITTED;
            $this->repo->save($enr);
            return $enr;
        });
    }
}
