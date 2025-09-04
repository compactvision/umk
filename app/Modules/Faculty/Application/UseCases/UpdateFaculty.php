<?php

namespace App\Modules\Faculty\Application\UseCases;

use App\Modules\Faculty\Domain\Entities\Faculty;
use App\Modules\Faculty\Domain\Exceptions\DuplicateFacultyException;
use App\Modules\Faculty\Domain\Repositories\FacultyRepository;

final class UpdateFaculty
{
    public function __construct(
        private FacultyRepository $repository
    ) {}

    public function execute(
        int $id,
        string $name,
        string $code,
        ?string $description,
        int $durationYears,
        bool $isActive
    ): Faculty {
        $faculty = $this->repository->findById($id);

        if (!$faculty) {
            throw new \RuntimeException("Faculté introuvable.");
        }

        // Vérifier unicité du nom (mais ignorer la faculté courante)
        $existingByName = $this->repository->findByName($name);
        if ($existingByName && $existingByName->id() !== $id) {
            throw new DuplicateFacultyException('nom', $name);
        }

        // Vérifier unicité du code (idem)
        $existingByCode = $this->repository->findByCode($code);
        if ($existingByCode && $existingByCode->id() !== $id) {
            throw new DuplicateFacultyException('code', $code);
        }

        // Mettre à jour l’entité
        $updatedFaculty = new Faculty(
            $id,
            $name,
            $code,
            $description,
            $durationYears,
            $isActive
        );

        return $this->repository->save($updatedFaculty);
    }
}
