<?php

namespace App\Modules\Blog\Infrastructure\Persistence\Eloquent\Repositories;

use App\Modules\Blog\Domain\Entities\Category as CategoryEntity;
use App\Modules\Blog\Domain\Repositories\CategoryRepository;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\CategoryModel;

final class EloquentCategoryRepository implements CategoryRepository
{
    public function findByName(string $name): ?CategoryEntity
    {
        $m = CategoryModel::where('name',$name)->first();
        return $m ? $this->toDomain($m) : null;
    }

    public function findBySlug(string $slug): ?CategoryEntity
    {
        $m = CategoryModel::where('slug',$slug)->first();
        return $m ? $this->toDomain($m) : null;
    }

    public function save(CategoryEntity $c): CategoryEntity
    {
        $m = new CategoryModel();
        $m->fill([
            'name' => $c->name,
            'slug' => $c->slug,
            'color' => $c->color,
            'description' => $c->description,
        ]);
        $m->save();

        return $this->toDomain($m);
    }

    private function toDomain(CategoryModel $m): CategoryEntity
    {
        return new CategoryEntity(
            id: $m->id,
            name: $m->name,
            slug: $m->slug,
            color: $m->color,
            description: $m->description,
        );
    }
}
