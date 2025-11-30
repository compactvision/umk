<?php

namespace App\Modules\Site\Application\UseCases;

use App\Modules\Site\Application\DTOs\SiteDto;
use App\Modules\Site\Domain\Repositories\SiteRepository;

class GetSiteInfo
{
    public function __construct(
        private SiteRepository $repository
    ) {}

    public function execute(): ?SiteDto
    {
        $site = $this->repository->get();
        return $site ? SiteDto::fromEntity($site) : null;
    }
}
