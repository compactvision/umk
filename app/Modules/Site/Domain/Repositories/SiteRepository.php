<?php

namespace App\Modules\Site\Domain\Repositories;

use App\Modules\Site\Domain\Entities\Site;

interface SiteRepository
{
    public function get(): ?Site;
    public function save(Site $site): Site;
}
