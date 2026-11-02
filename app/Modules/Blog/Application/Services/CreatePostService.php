<?php

namespace App\Modules\Blog\Application\Services;

use App\Modules\Blog\Application\DTO\CreatePostData;
use App\Modules\Blog\Domain\Entities\Post;
use App\Modules\Blog\Domain\Repositories\PostRepository;
use App\Modules\Blog\Domain\ValueObjects\ImageSet;
use Illuminate\Support\Str;

class CreatePostService
{
    public function __construct(private PostRepository $posts) {}

    public function handle(CreatePostData $data): Post
    {
        $slug = Str::slug($data->title);

        $post = new Post(
            id: null,
            uuid: (string) Str::uuid(),
            categoryId: $data->categoryId,
            authorId: $data->authorId,
            title: $data->title,
            slug: $slug,
            excerpt: $data->excerpt,
            content: $data->content,
            images: new ImageSet($data->mainImage1, $data->mainImage2, $data->gallery),
            readTime: $data->readTime,
            gradient: $data->gradient,
            featured: $data->featured,
            views: 0,
            likes: 0,
            commentsCount: 0,
            status: $data->status,
            publishedAt: $data->publishedAt,
            videoUrl: $data->videoUrl,
        );

        return $this->posts->save($post);
    }
}
