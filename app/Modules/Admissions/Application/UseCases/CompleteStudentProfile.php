<?php

namespace App\Modules\Admissions\Application\UseCases;

use App\Modules\Admissions\Application\DTOs\CompleteStudentProfileDTO;
use App\Modules\Admissions\Domain\Entities\Student;
use App\Modules\Admissions\Domain\Repositories\StudentRepository;
use App\Modules\Admissions\Domain\ValueObjects\StudentProfile;

final class CompleteStudentProfile
{
    public function __construct(private StudentRepository $repo) {}

    public function execute(CompleteStudentProfileDTO $dto): void
    {
        $student = $this->repo->byUserId($dto->userId);
        if (!$student) $student = Student::fromUser($dto->userId);

        $profile = new StudentProfile(
            $dto->firstName, $dto->lastName, $dto->birthDate, $dto->gender,
            $dto->nationalId, $dto->phone, $dto->address,
            $dto->previousSchool, $dto->emergencyContact,
        );

        $student->attachProfile($profile);
        $this->repo->save($student);
    }
}
