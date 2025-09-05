<?php

namespace App\Modules\Level\Application\UseCases;

use App\Modules\Level\Domain\Repositories\LevelRepository;

final class DeleteLevel
{
    public function __construct(private LevelRepository $repo) {}

    public function execute(int $id): void
    {
        $this->repo->delete($id);
    }
}
