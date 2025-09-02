<?php

namespace App\Modules\Identity\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Identity\Domain\Repositories\UserRepository;
use App\Modules\Identity\Infrastructure\Persistence\EloquentUserRepository;
use App\Modules\Identity\Domain\Services\UserEmailVerificationService;
use App\Modules\Identity\Domain\Services\PasswordResetNotifier;
use App\Modules\Identity\Infrastructure\Notifications\LaravelEmailVerificationNotifier;
use App\Modules\Identity\Infrastructure\Notifications\LaravelPasswordResetNotifier;
use App\Modules\Identity\Infrastructure\Security\BcryptPasswordHasher;
use App\Modules\Identity\Domain\Services\PasswordHasher;

class IdentityServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // On dit à Laravel : quand tu vois UserRepository → utilise EloquentUserRepository
        $this->app->bind(UserRepository::class, EloquentUserRepository::class);
        $this->app->bind(UserEmailVerificationService::class, LaravelEmailVerificationNotifier::class);
        $this->app->bind(PasswordResetNotifier::class, LaravelPasswordResetNotifier::class);
        $this->app->bind(PasswordHasher::class, BcryptPasswordHasher::class);
    }

    public function boot(): void
    {
        //
    }
}
