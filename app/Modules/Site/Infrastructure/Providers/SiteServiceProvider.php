<?php

namespace App\Modules\Site\Infrastructure\Providers;

use App\Modules\Site\Domain\Repositories\SiteRepository;
use App\Modules\Site\Infrastructure\Persistence\EloquentSiteRepository;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class SiteServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SiteRepository::class, EloquentSiteRepository::class);
    }

    public function boot(): void
    {
        $this->registerRoutes();
    }

    private function registerRoutes(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(function () {
                require __DIR__ . '/../Http/Routes/api.php';
            });
    }
}
