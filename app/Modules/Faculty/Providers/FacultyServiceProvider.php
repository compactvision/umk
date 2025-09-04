<?php

namespace App\Modules\Faculty\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Faculty\Domain\Repositories\FacultyRepository;
use App\Modules\Faculty\Infrastructure\Persistence\EloquentFacultyRepository;

class FacultyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(FacultyRepository::class, EloquentFacultyRepository::class);
    }
}
