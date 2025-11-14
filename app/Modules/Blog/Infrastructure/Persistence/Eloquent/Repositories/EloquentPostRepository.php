<?php

namespace App\Modules\Blog\Infrastructure\Persistence\Eloquent\Repositories;

use App\Modules\Blog\Domain\Entities\Post;
use App\Modules\Blog\Domain\Repositories\PostRepository;
use App\Modules\Blog\Domain\ValueObjects\ImageSet;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;

class EloquentPostRepository implements PostRepository
{
    public function findById(int $id): ?Post
    {
        $m = PostModel::find($id);
        return $m ? $this->toDomain($m) : null;
    }

    public function findBySlug(string $slug): ?Post
    {
        $m = PostModel::where('slug', $slug)->first();
        return $m ? $this->toDomain($m) : null;
    }

    public function save(Post $p): Post
    {
        $m = new PostModel();
        $this->mapToModel($p, $m);
        $m->save();
        return $this->toDomain($m);
    }

    public function update(Post $p): Post
    {
        $m = PostModel::findOrFail($p->id);
        $this->mapToModel($p, $m);
        $m->save();
        return $this->toDomain($m);
    }

    public function delete(int $id): void
    {
        PostModel::whereKey($id)->delete();
    }

    public function incrementViews(int $id): void
    {
        PostModel::whereKey($id)->increment('views');
    }

    /**
     * @inheritDoc
     */
    public function getAll(int $perPage = 10, int $page = 1): array
    {
        $result = PostModel::query()
            ->with(['category', 'author'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        return [
            'data' => $result->map(fn($m) => $this->toDomain($m))->toArray(),
            'current_page' => $result->currentPage(),
            'last_page' => $result->lastPage(),
            'per_page' => $result->perPage(),
            'total' => $result->total(),
        ];
    }

    public function getFeatured(int $limit = 3): array
    {
        $result = PostModel::query()
            ->with(['category', 'author'])
            ->where('featured', true)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        return $result->map(fn($m) => $this->toDomain($m))->toArray();
    }

    private function mapToModel(Post $p, PostModel $m): void
    {
        $m->fill([
            'uuid' => $p->uuid,
            'category_id' => $p->categoryId,
            'author_id' => $p->authorId,
            'title' => $p->title,
            'slug' => $p->slug,
            'excerpt' => $p->excerpt,
            'content' => $p->content,
            'main_image_1' => $p->images->main1,
            'main_image_2' => $p->images->main2,
            'gallery'      => $p->images->gallery,
            'read_time' => $p->readTime,
            'gradient' => $p->gradient,
            'featured' => $p->featured,
            'views' => $p->views,
            'likes' => $p->likes,
            'comments_count' => $p->commentsCount,
            'status' => $p->status,
            'published_at' => $p->publishedAt,
        ]);
    }

    private function toDomain(PostModel $m): Post
    {
        $gallery = null;
        if (!empty($m->gallery)) {
            $decoded = json_decode($m->gallery, true);
            $gallery = is_array($decoded) ? $decoded : [];
        } else {
            $gallery = [];
        }

        $publishedAt = null;
        if ($m->created_at) {
            try {
                $publishedAt = new \DateTimeImmutable($m->created_at);
            } catch (\Exception $e) {
                $publishedAt = null;
            }
        }

        $categoryDto = null;
        if ($m->relationLoaded('category') && $m->category) {
            $categoryDto = new \App\Modules\Blog\Domain\Entities\Category(
                id: $m->category->id ?? null,
                name: $m->category->name ?? null,
                slug: $m->category->slug ?? null,
                color: $m->category->color ?? null,
                description: $m->category->description ?? null,
            );
        }

        $authorDto = null;
        if ($m->relationLoaded('author') && $m->author) {
            $authorDto = $m->author; // pas de new User(), pas de array
        }

        return new Post(
            id: $m->id,
            uuid: $m->uuid,
            categoryId: $m->category_id,
            authorId: $m->author_id,
            title: $m->title,
            slug: $m->slug,
            excerpt: $m->excerpt,
            content: $m->content,
            images: new ImageSet($m->main_image_1, $m->main_image_2, $gallery),
            readTime: $m->read_time,
            gradient: $m->gradient,
            featured: (bool) $m->featured,
            views: (int) $m->views,
            likes: (int) $m->likes,
            commentsCount: (int) $m->comments_count,
            status: $m->status,
            publishedAt: $publishedAt,
            category: $categoryDto,
            author: $authorDto,
        );
    }
}
