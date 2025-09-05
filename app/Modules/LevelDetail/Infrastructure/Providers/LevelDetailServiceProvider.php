<?php

namespace App\Modules\LevelDetail\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\LevelDetail\Domain\Repositories\LevelDetailRepository;
use App\Modules\LevelDetail\Infrastructure\Persistence\EloquentLevelDetailRepository;

class LevelDetailServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(LevelDetailRepository::class, EloquentLevelDetailRepository::class);
    }
}
