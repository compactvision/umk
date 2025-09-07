<?php

namespace App\Modules\AdmissionCondition\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;
use App\Modules\AdmissionCondition\Infrastructure\Persistence\EloquentAdmissionConditionRepository;

class AdmissionConditionServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AdmissionConditionRepository::class, EloquentAdmissionConditionRepository::class);
    }
}
