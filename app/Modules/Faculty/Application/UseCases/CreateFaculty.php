<?php

namespace App\Modules\Faculty\Application\UseCases;

use App\Modules\Faculty\Domain\Entities\Faculty;
use App\Modules\Faculty\Domain\Exceptions\DuplicateFacultyException;
use App\Modules\Faculty\Domain\Repositories\FacultyRepository;

final class CreateFaculty
{
    public function __construct(
        private FacultyRepository $repository
    ) {}

    public function execute(
        string $name,
        string $code,
        ?string $description,
        int $durationYears,
        bool $isActive
    ): Faculty {
        // Vérifier unicité du nom
        if ($this->repository->findByName($name)) {
            throw new DuplicateFacultyException('nom', $name);
        }

        // Vérifier unicité du code
        if ($this->repository->findByCode($code)) {
            throw new DuplicateFacultyException('code', $code);
        }

        $faculty = new Faculty(
            null,
            $name,
            $code,
            $description,
            $durationYears,
            $isActive
        );

        return $this->repository->save($faculty);
    }
}
