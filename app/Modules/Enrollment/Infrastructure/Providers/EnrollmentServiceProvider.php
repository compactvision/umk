<?php


namespace App\Modules\Enrollment\Infrastructure\Providers;

use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use App\Modules\Enrollment\Infrastructure\Persistence\EloquentDocumentRepository;
use App\Modules\Enrollment\Infrastructure\Persistence\EloquentEnrollmentRepository;
use Illuminate\Support\ServiceProvider;

class EnrollmentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind repositories
        $this->app->bind(
            EnrollmentRepositoryInterface::class,
            EloquentEnrollmentRepository::class
        );

        $this->app->bind(
            DocumentRepositoryInterface::class,
            EloquentDocumentRepository::class
        );

        // Register use cases as singletons for better performance
        $this->app->singleton(\App\Modules\Enrollment\Application\UseCases\SaveProgressUseCase::class);
        $this->app->singleton(\App\Modules\Enrollment\Application\UseCases\GetDraftUseCase::class);
        $this->app->singleton(\App\Modules\Enrollment\Application\UseCases\SubmitEnrollmentUseCase::class);
        $this->app->singleton(\App\Modules\Enrollment\Application\UseCases\UploadDocumentUseCase::class);
        $this->app->singleton(\App\Modules\Enrollment\Application\UseCases\ValidateEnrollmentUseCase::class);
        $this->app->singleton(\App\Modules\Enrollment\Application\UseCases\RejectEnrollmentUseCase::class);

        // Register domain services
        $this->app->singleton(\App\Modules\Enrollment\Domain\Services\MatriculeGenerator::class);
        $this->app->singleton(\App\Modules\Enrollment\Domain\Services\EnrollmentValidator::class);
        $this->app->singleton(\App\Modules\Enrollment\Domain\Services\DocumentStorageService::class);
    }

    public function boot(): void
    {
        // Load migrations
        // $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
    }
}