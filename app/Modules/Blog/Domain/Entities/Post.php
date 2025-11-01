<?php

namespace App\Modules\Blog\Domain\Entities;

use App\Modules\Blog\Domain\ValueObjects\ImageSet;
use DateTimeInterface;

final class Post
{
    public function __construct(
        public ?int $id,
        public string $uuid,
        public ?int $categoryId,
        public int $authorId,
        public string $title,
        public string $slug,
        public ?string $excerpt,
        public ?string $content,
        public ImageSet $images,
        public ?string $readTime,
        public ?string $gradient,
        public bool $featured,
        public int $views,
        public int $likes,
        public int $commentsCount,
        public string $status,
        public ?DateTimeInterface $publishedAt,
    ) {}
}
