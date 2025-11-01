<?php

namespace App\Modules\Blog\Domain\Repositories;

use App\Modules\Blog\Domain\Entities\Post;

interface PostRepository
{
    public function findById(int $id): ?Post;
    public function findBySlug(string $slug): ?Post;
    public function save(Post $post): Post;
    public function update(Post $post): Post;
    public function delete(int $id): void;
    public function incrementViews(int $id): void;
}
