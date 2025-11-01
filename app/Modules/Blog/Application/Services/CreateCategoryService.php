<?php

namespace App\Modules\Blog\Application\Services;

use App\Modules\Blog\Application\DTO\CreateCategoryData;
use App\Modules\Blog\Domain\Entities\Category;
use App\Modules\Blog\Domain\Repositories\CategoryRepository;
use Illuminate\Support\Str;

final class CreateCategoryService
{
    public function __construct(private CategoryRepository $categories) {}

    public function handle(CreateCategoryData $data): Category
    {
        $slugBase = Str::slug($data->name);
        $slug = $slugBase;
        $i = 2;
        while ($this->categories->findBySlug($slug)) {
            $slug = $slugBase.'-'.$i++;
        }

        $category = new Category(
            id: null,
            name: $data->name,
            slug: $slug,
            color: $data->color,
            description: $data->description,
        );

        return $this->categories->save($category);
    }
}
