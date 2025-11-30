<?php

namespace App\Modules\Newsletter\Infrastructure\Providers;

use App\Modules\Newsletter\Domain\Repositories\NewsletterRepository;
use App\Modules\Newsletter\Infrastructure\Persistence\EloquentNewsletterRepository;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class NewsletterServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(NewsletterRepository::class, EloquentNewsletterRepository::class);
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
