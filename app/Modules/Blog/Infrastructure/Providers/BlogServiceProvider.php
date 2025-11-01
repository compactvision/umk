<?php

namespace App\Modules\Blog\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Blog\Domain\Repositories\PostRepository;
use App\Modules\Blog\Domain\Repositories\CategoryRepository;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Repositories\EloquentPostRepository;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Repositories\EloquentCategoryRepository;

class BlogServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PostRepository::class, EloquentPostRepository::class);
        $this->app->bind(CategoryRepository::class, EloquentCategoryRepository::class);
        // idem CommentRepository...
    }
}
