<?php

namespace App\Modules\AcademicYear\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use App\Modules\AcademicYear\Infrastructure\Persistence\EloquentAcademicYearRepository;

class AcademicYearServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(AcademicYearRepository::class, EloquentAcademicYearRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
    }
}
