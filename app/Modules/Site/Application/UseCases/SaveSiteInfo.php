<?php

namespace App\Modules\Site\Application\UseCases;

use App\Modules\Site\Application\DTOs\SiteDto;
use App\Modules\Site\Domain\Entities\Site;
use App\Modules\Site\Domain\Repositories\SiteRepository;

class SaveSiteInfo
{
    public function __construct(
        private SiteRepository $repository
    ) {}

    public function execute(SiteDto $dto): SiteDto
    {
        $site = new Site(
            $dto->id,
            $dto->siteName,
            $dto->siteTagline,
            $dto->contactEmail,
            $dto->contactPhone,
            $dto->address,
            $dto->logoUrl,
            $dto->faviconUrl,
            $dto->socialLinks,
            $dto->description
        );

        $savedSite = $this->repository->save($site);

        return SiteDto::fromEntity($savedSite);
    }
}
