<?php
// app/Modules/Blog/Application/Services/UpdatePostService.php

namespace App\Modules\Blog\Application\Services;

use App\Modules\Blog\Application\DTO\UpdatePostData;
use App\Modules\Blog\Domain\Entities\Post;
use App\Modules\Blog\Domain\Repositories\PostRepository;
use App\Modules\Blog\Domain\ValueObjects\ImageSet; // en supposant ce namespace
use Illuminate\Support\Str;

final class UpdatePostService
{
    public function __construct(
        private PostRepository $posts,
    ) {}

    public function handle(UpdatePostData $dto): Post
    {
        $post = $this->posts->findById($dto->postId);
        if (!$post) {
            throw new \RuntimeException("Post #{$dto->postId} non trouvé.");
        }

        // 1) Slug si demandé et nouveau titre fourni
        if ($dto->regenerateSlug && $dto->title !== null) {
            $post->slug = $this->makeUniqueSlug($dto->title, $post->id);
        }

        // 2) Champs simples (on applique uniquement si non null)
        if ($dto->categoryId !== null)  $post->categoryId  = $dto->categoryId;
        if ($dto->title !== null)       $post->title       = $dto->title;
        if ($dto->excerpt !== null)     $post->excerpt     = $dto->excerpt;
        if ($dto->content !== null)     $post->content     = $dto->content;
        if ($dto->readTime !== null)    $post->readTime    = $dto->readTime;
        if ($dto->gradient !== null)    $post->gradient    = $dto->gradient;
        if ($dto->featured !== null)    $post->featured    = (bool) $dto->featured;
        if ($dto->status !== null)      $post->status      = $dto->status;
        if ($dto->publishedAt !== null) $post->publishedAt = $dto->publishedAt;
        // if ($dto->seoTitle !== null)    $post->seoTitle    = $dto->seoTitle;
        // if ($dto->seoDescription !== null) $post->seoDescription = $dto->seoDescription;

        // 3) Images principales (main1/main2)
        $currentMain1 = $post->images->main1 ?? null;
        $currentMain2 = $post->images->main2 ?? null;

        $newMain1 = $currentMain1;
        if ($dto->mainImage1 !== null) {
            $newMain1 = ($dto->mainImage1 === UpdatePostData::REMOVE) ? null : $dto->mainImage1;
        }

        $newMain2 = $currentMain2;
        if ($dto->mainImage2 !== null) {
            $newMain2 = ($dto->mainImage2 === UpdatePostData::REMOVE) ? null : $dto->mainImage2;
        }

        // 4) Galerie (table JSON/array comme dans ta mapToModel)
        $currentGallery = $post->images->gallery ?? [];

        $newGallery = $currentGallery;
        if ($dto->gallery !== null) {
            if ($dto->replaceGallery) {
                $newGallery = array_values($dto->gallery);
            } else {
                // append en évitant les doublons par "path"
                $byPath = [];
                foreach ($currentGallery as $g) {
                    $byPath[$g['path']] = $g;
                }
                foreach ($dto->gallery as $g) {
                    $byPath[$g['path']] = $g; // remplace si même path
                }
                $newGallery = array_values($byPath);
            }
        }

        // 5) Recompose l'ImageSet
        $post->images = new ImageSet(
            main1: $newMain1,
            main2: $newMain2,
            gallery: $newGallery
        );

        // 6) Persistance
        $post = $this->posts->update($post);

        return $post;
    }

    /**
     * Génère un slug unique basé sur le repository.
     * On s'appuie sur findBySlug() puisque tu l'as déjà.
     */
    private function makeUniqueSlug(string $title, int $ignoreId): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i = 2;

        // On boucle tant qu’un autre post (id != ignoreId) possède le même slug
        while (true) {
            $conflict = $this->posts->findBySlug($slug);
            if (!$conflict || (int) $conflict->id === (int) $ignoreId) {
                return $slug;
            }
            $slug = "{$base}-{$i}";
            $i++;
        }
    }
}
