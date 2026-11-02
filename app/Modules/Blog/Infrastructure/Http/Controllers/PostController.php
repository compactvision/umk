<?php

namespace App\Modules\Blog\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Blog\Infrastructure\Http\Request\StorePostRequest;
use App\Modules\Blog\Application\Services\CreatePostService;
use App\Modules\Blog\Application\DTO\CreatePostData;
use App\Modules\Blog\Application\DTO\UpdatePostData;
use App\Modules\Blog\Application\Services\UpdatePostService;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\CategoryModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index()
    {
        $q          = request('q');
        $categoryId = request('category_id');
        $status     = request('status');

        $posts = PostModel::query()
            ->orderByDesc('id')
            ->paginate(9)
            ->through(fn($p) => [
                'id'           => $p->id,
                'uuid'         => $p->uuid,
                'title'        => $p->title,
                'slug'         => $p->slug,
                'excerpt'      => $p->excerpt,
            'video_url' => $p->video_url,
            'videoUrl' => $p->video_url,
                'main_image_1' => $p->main_image_1 ? $this->mediaUrl($p->main_image_1) : null,
                'main_image_2' => $p->main_image_2 ? $this->mediaUrl($p->main_image_2) : null,
                'views'        => (int) $p->views,
                'likes'        => (int) $p->likes,
                'featured'     => (bool) $p->featured,
                'status'       => $p->status,
                'published_at' => optional($p->published_at)?->toIso8601String(),
                'category'     => $p->category?->only(['id', 'name']),
                'author'       => $p->author?->only(['id', 'name']),
                'created_at'   => $p->created_at?->toIso8601String(),
            ])
            ->withQueryString();

        $categories = CategoryModel::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('dashboard/blog/Index', [
            'categories' => $categories,
            'posts'      => $posts,
            'videoUploadLimitMb' => \App\Modules\Blog\Infrastructure\Rules\VideoUploadLimit::kilobytes() / 1024,
            'filters'    => compact('q', 'categoryId', 'status'),
        ]);
    }
    public function store(StorePostRequest $request, CreatePostService $service)
    {
        $authorId = $request->user()->id;

        // Stockage images principales (si envoyées)
        $main1 = $request->file('main_image_1')?->store('posts/main', 'public');
        $main2 = $request->file('main_image_2')?->store('posts/main', 'public');

        $video = $request->file('video_file')?->store('posts/videos', 'public') ?? $request->input('video_url');
        $gallery = [];
        foreach ($request->file('gallery', []) as $image) {
            $gallery[] = ['path' => $image->store('posts/gallery', 'public')];
        }

        $dto = new CreatePostData(
            categoryId: $request->integer('category_id') ?: null,
            authorId: $authorId,
            title: $request->string('title'),
            excerpt: $request->input('excerpt'),
            content: $request->input('content'),
            mainImage1: $main1,
            mainImage2: $main2,
            gallery: $gallery,
            readTime: $request->input('read_time'),
            gradient: $request->input('gradient'),
            featured: (bool) $request->boolean('featured'),
            status: $request->input('status', 'draft'),
            publishedAt: $request->date('published_at'),
            seoTitle: $request->input('seo_title'),
            seoDescription: $request->input('seo_description'),
            videoUrl: $video,
        );

        $post = $service->handle($dto);

        return redirect()->back()
            ->with('success', 'Article créé avec succès');
    }

    public function show(string $slug)
    {
        $p = PostModel::where('slug', $slug)
            ->firstOrFail();

        $post = [
            'id'           => $p->id,
            'uuid'         => $p->uuid,
            'title'        => $p->title,
            'slug'         => $p->slug,
            'excerpt'      => $p->excerpt,
            'video_url' => $p->video_url,
            'videoUrl' => $p->video_url,
            'content'      => $p->content, // HTML ou texte brut
            'read_time'    => $p->read_time,
            'gradient'     => $p->gradient,
            'featured'     => (bool) $p->featured,
            'status'       => $p->status,
            'published_at' => optional($p->published_at)?->toIso8601String(),

            'main_image_1' => $p->main_image_1 ? $this->mediaUrl($p->main_image_1) : null,
            'main_image_2' => $p->main_image_2 ? $this->mediaUrl($p->main_image_2) : null,
            'gallery'      => collect($p->gallery ?? [])->map(function ($g) {
                return [
                    'path'    => isset($g['path']) ? $this->mediaUrl($g['path']) : null,
                    'alt'     => $g['alt'] ?? null,
                    'caption' => $g['caption'] ?? null,
                ];
            })->filter(fn($g) => !empty($g['path']))->values(),

            'views'        => (int) $p->views,
            'likes'        => (int) $p->likes,

            'category'     => $p->category?->only(['id', 'name']),
            'author'       => $p->author?->only(['id', 'name']),
            'created_at'   => $p->created_at?->toIso8601String(),
        ];

        return Inertia::render('dashboard/blog/Show', [
            'post' => $post,
            'videoUploadLimitMb' => \App\Modules\Blog\Infrastructure\Rules\VideoUploadLimit::kilobytes() / 1024,
            'can'  => [
                'update' => true,
                'delete' => true,
            ],
        ]);
    }

    public function update(Request $request, int $id, UpdatePostService $service)
    {
        $validated = $request->validate([
            'video_url' => ['nullable', 'url', 'max:2048', new \App\Modules\Blog\Infrastructure\Rules\VideoUrl],
            'video_file' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm', 'max:'.\App\Modules\Blog\Infrastructure\Rules\VideoUploadLimit::kilobytes(), 'prohibits:video_url'],
            'remove_video' => ['sometimes', 'boolean'],
            'category_id'   => ['nullable', 'integer', 'exists:categories,id'],
            'title'         => ['nullable', 'string', 'max:255'],
            'excerpt'       => ['nullable', 'string', 'max:300'],
            'content'       => ['nullable', 'string'],
            'read_time'     => ['nullable', 'string', 'max:50'],
            'gradient'      => ['nullable', 'string', 'max:100'],
            'featured'      => ['nullable', 'boolean'],
            'status'        => ['nullable', 'in:draft,published,archived'],
            'published_at'  => ['nullable', 'date'],

            'main_image_1'  => ['nullable', 'image', 'max:5120'],
            'main_image_2'  => ['nullable', 'image', 'max:5120'],
            'remove_main_image_1' => ['sometimes', 'boolean'],
            'remove_main_image_2' => ['sometimes', 'boolean'],

            'gallery.*'     => ['nullable', 'image', 'max:4096'],
            'replace_gallery' => ['sometimes', 'boolean'],

            'seo_title'       => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:300'],

            'regenerate_slug' => ['sometimes', 'boolean'],
        ]);

        // 1) Uploads -> chemins finaux (ou null si non fourni)
        $disk = 'public';
        $main1 = null;
        $main2 = null;

        if ($request->boolean('remove_main_image_1')) {
            $main1 = UpdatePostData::REMOVE;
        } elseif ($request->hasFile('main_image_1')) {
            $main1 = $request->file('main_image_1')->store('blog/covers', $disk);
        }

        if ($request->boolean('remove_main_image_2')) {
            $main2 = UpdatePostData::REMOVE;
        } elseif ($request->hasFile('main_image_2')) {
            $main2 = $request->file('main_image_2')->store('blog/covers', $disk);
        }

        // Galerie (on convertit en tableau d’items {path,alt,caption})
        $galleryItems = null;
        if ($request->hasFile('gallery')) {
            $galleryItems = [];
            foreach ($request->file('gallery') as $img) {
                $galleryItems[] = [
                    'path' => $img->store('blog/gallery', $disk),
                    // 'alt' => ... (optionnel, récupère depuis formulaire si tu as un champ)
                    // 'caption' => ...
                ];
            }
        }

        $video = $request->file('video_file')?->store('posts/videos', 'public')
            ?? ($request->input('video_url') ?: ($request->boolean('remove_video') ? UpdatePostData::REMOVE : null));

        $dto = new UpdatePostData(
            postId: $id,
            videoUrl: $video,
            categoryId: $validated['category_id'] ?? null,
            title: $validated['title'] ?? null,
            excerpt: $validated['excerpt'] ?? null,
            content: $validated['content'] ?? null,
            mainImage1: $main1,                 // (string path) | "__REMOVE__" | null
            mainImage2: $main2,                 // (string path) | "__REMOVE__" | null
            gallery: $galleryItems,             // null = ne rien faire, [] = remplacer par vide si replace_gallery = true
            readTime: $validated['read_time'] ?? null,
            gradient: $validated['gradient'] ?? null,
            featured: array_key_exists('featured', $validated) ? (bool)$validated['featured'] : null,
            status: $validated['status'] ?? null,
            publishedAt: !empty($validated['published_at']) ? new \DateTimeImmutable($validated['published_at']) : null,
            seoTitle: $validated['seo_title'] ?? null,
            seoDescription: $validated['seo_description'] ?? null,
            replaceGallery: (bool)($validated['replace_gallery'] ?? false),
            regenerateSlug: (bool)($validated['regenerate_slug'] ?? false),
        );

        $post = $service->handle($dto);

        return redirect()
            ->route('dashboard.admin.posts.show', $post->slug)
            ->with('success', 'Article mis à jour avec succès.');
    }
    private function mediaUrl(string $path): string
    {
        return preg_match('#^(https?://|/)#', $path) ? $path : Storage::url($path);
    }

}
