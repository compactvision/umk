<?php

namespace App\Modules\Blog\Application\DTO;

class CreatePostData
{
    public function __construct(
        public readonly ?int $categoryId,
        public readonly int $authorId,
        public readonly string $title,
        public readonly ?string $excerpt,
        public readonly ?string $content,
        public readonly ?string $mainImage1, // chemin final ou null
        public readonly ?string $mainImage2,
        /** @var array<int, array{path:string, alt?:string, caption?:string}> */
        public readonly array $gallery,
        public readonly ?string $readTime,
        public readonly ?string $gradient,
        public readonly bool $featured,
        public readonly string $status,
        public readonly ?\DateTimeInterface $publishedAt,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
    ) {}
}
