<?php

namespace App\Modules\Seo\Application;

use App\Models\Seo\LegalPage;
use App\Models\Seo\SeoPage;
use App\Models\Seo\SeoSetting;
use Illuminate\Support\Facades\Schema;

class SeoRepository
{
    private ?array $settings = null;

    public function settings(): array
    {
        return $this->settings ??= (Schema::hasTable('seo_settings') ? (SeoSetting::first()?->values ?? []) : []);
    }

    public function identity(): array
    {
        return array_replace(config('seo.identity'), array_filter($this->settings()['identity'] ?? [], fn ($v) => is_string($v) && trim($v) !== ''));
    }

    public function page(string $path): ?SeoPage
    {
        return Schema::hasTable('seo_pages') ? SeoPage::where('path', $path)->first() : null;
    }

    public function legal(string $key): ?LegalPage
    {
        return Schema::hasTable('legal_pages') ? LegalPage::where('key', $key)->first() : null;
    }

    public function publicSettings(): array
    {
        return ['identity' => \Illuminate\Support\Arr::only($this->identity(), ['name', 'email', 'phone', 'address', 'city', 'country']), 'analytics_enabled' => (bool) ($this->settings()['analytics_enabled'] ?? false), 'copyright_year' => (int) now('Africa/Kinshasa')->format('Y')];
    }
}
