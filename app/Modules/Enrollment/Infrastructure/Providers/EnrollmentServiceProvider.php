<?php

namespace App\Modules\Enrollment\Infrastructure\Providers;


use Illuminate\Support\ServiceProvider;
use App\Modules\Enrollment\Domain\Repositories\{EnrollmentRepository, EnrollmentDocumentRepository, EnrollmentRequirementRepository};
use App\Modules\Enrollment\Infrastructure\Persistence\{EloquentEnrollmentRepository, EloquentEnrollmentDocumentRepository, EloquentEnrollmentRequirementRepository};
use App\Modules\Enrollment\Domain\Services\{CoffreFortStorage, RequiredDocumentProvider};
use App\Modules\Enrollment\Infrastructure\Services\{LocalCoffreFortStorage, ConditionRequiredDocumentProvider};


class EnrollmentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(EnrollmentRepository::class, EloquentEnrollmentRepository::class);
        $this->app->bind(EnrollmentDocumentRepository::class, EloquentEnrollmentDocumentRepository::class);
        $this->app->bind(EnrollmentRequirementRepository::class, EloquentEnrollmentRequirementRepository::class);
        $this->app->bind(CoffreFortStorage::class, LocalCoffreFortStorage::class);
        $this->app->bind(RequiredDocumentProvider::class, ConditionRequiredDocumentProvider::class);
    }


    public function boot(): void {}
}
