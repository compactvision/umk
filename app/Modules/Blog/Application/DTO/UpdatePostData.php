<?php
// app/Modules/Blog/Application/DTO/UpdatePostData.php

namespace App\Modules\Blog\Application\DTO;

final class UpdatePostData
{
    public function __construct(
        public readonly int $postId,                 // identifiant du Post à modifier

        // Champs éditables (tous optionnels, null = ne pas changer)
        public readonly ?int $categoryId = null,
        public readonly ?string $title = null,
        public readonly ?string $excerpt = null,
        public readonly ?string $content = null,
        public readonly ?string $readTime = null,
        public readonly ?string $gradient = null,
        public readonly ?bool $featured = null,
        public readonly ?string $status = null,      // 'draft'|'published'|'archived'
        public readonly ?\DateTimeInterface $publishedAt = null,

        // Images principales : 
        // - string = nouveau chemin (remplacement)
        // - null   = ne pas changer
        // - "__REMOVE__" = supprimer (constante ci-dessous)
        public readonly ?string $mainImage1 = null,
        public readonly ?string $mainImage2 = null,

        // Galerie :
        // - $replaceGallery === true => on remplace entièrement par $gallery
        // - sinon, on append $gallery (merge) si fourni
        /** @var array<int, array{path:string, alt?:string, caption?:string}>|null */
        public readonly ?array $gallery = null,
        public readonly bool $replaceGallery = false,

        // SEO (facultatif)
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,

        // Slug
        public readonly bool $regenerateSlug = false,
        public readonly ?string $videoUrl = null,
        public readonly bool $replaceCategory = false,
        /** @var list<string> */
        public readonly array $clearFields = [],
    ) {}

    public const REMOVE = '__REMOVE__';
}
