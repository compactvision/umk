<?php

namespace App\Modules\Faculty\Application\UseCases;

use App\Modules\Faculty\Domain\Entities\Faculty;
use App\Modules\Faculty\Domain\Repositories\FacultyRepository;

final class DeleteFaculty
{
    public function __construct(
        private FacultyRepository $repository
    ) {}

    public function execute(Faculty $faculty): void
    {
        $this->repository->delete($faculty);
    }
}
