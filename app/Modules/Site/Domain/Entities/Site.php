<?php

namespace App\Modules\Site\Domain\Entities;

class Site
{
    public function __construct(
        private ?int $id,
        private string $siteName,
        private ?string $siteTagline,
        private ?string $contactEmail,
        private ?string $contactPhone,
        private ?string $address,
        private ?string $logoUrl,
        private ?string $faviconUrl,
        private ?array $socialLinks,
        private ?string $description
    ) {}

    public function id(): ?int
    {
        return $this->id;
    }

    public function siteName(): string
    {
        return $this->siteName;
    }

    public function siteTagline(): ?string
    {
        return $this->siteTagline;
    }

    public function contactEmail(): ?string
    {
        return $this->contactEmail;
    }

    public function contactPhone(): ?string
    {
        return $this->contactPhone;
    }

    public function address(): ?string
    {
        return $this->address;
    }

    public function logoUrl(): ?string
    {
        return $this->logoUrl;
    }

    public function faviconUrl(): ?string
    {
        return $this->faviconUrl;
    }

    public function socialLinks(): ?array
    {
        return $this->socialLinks;
    }

    public function description(): ?string
    {
        return $this->description;
    }
}
