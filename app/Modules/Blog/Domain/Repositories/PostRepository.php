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
    
    /**
     * Récupère les posts avec pagination
     * 
     * @param int $perPage Nombre d'éléments par page
     * @param int $page Numéro de la page
     * @return array{data: Post[], current_page: int, last_page: int, per_page: int, total: int}
     */
    public function getAll(int $perPage = 10, int $page = 1): array;
}
