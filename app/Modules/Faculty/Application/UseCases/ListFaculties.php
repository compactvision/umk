<?php

namespace App\Modules\Faculty\Application\UseCases;

use App\Modules\Faculty\Domain\Repositories\FacultyRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListFaculties
{
    public function __construct(
        private FacultyRepository $repository
    ) {}

    public function execute(int $perPage = 10): LengthAwarePaginator
    {
        return $this->repository->paginate($perPage);
    }
}
