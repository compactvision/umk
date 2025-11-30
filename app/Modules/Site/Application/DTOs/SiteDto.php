<?php

namespace App\Modules\Site\Application\DTOs;

use App\Modules\Site\Domain\Entities\Site;

class SiteDto
{
    public function __construct(
        public ?int $id,
        public string $siteName,
        public ?string $siteTagline,
        public ?string $contactEmail,
        public ?string $contactPhone,
        public ?string $address,
        public ?string $logoUrl,
        public ?string $faviconUrl,
        public ?array $socialLinks,
        public ?string $description
    ) {}

    public static function fromEntity(Site $site): self
    {
        return new self(
            $site->id(),
            $site->siteName(),
            $site->siteTagline(),
            $site->contactEmail(),
            $site->contactPhone(),
            $site->address(),
            $site->logoUrl(),
            $site->faviconUrl(),
            $site->socialLinks(),
            $site->description()
        );
    }
}
