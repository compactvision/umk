<?php

namespace App\Modules\Level\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Level\Domain\Repositories\LevelRepository;
use App\Modules\Level\Infrastructure\Persistence\EloquentLevelRepository;

class LevelServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(LevelRepository::class, EloquentLevelRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
