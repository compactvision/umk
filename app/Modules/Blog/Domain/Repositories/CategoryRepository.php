<?php

namespace App\Modules\Blog\Domain\Repositories;

use App\Modules\Blog\Domain\Entities\Category;

interface CategoryRepository
{
    public function findByName(string $name): ?Category;
    public function findBySlug(string $slug): ?Category;
    public function save(Category $category): Category;
}
