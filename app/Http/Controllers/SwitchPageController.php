<?php

namespace App\Http\Controllers;

use App\Http\Resources\FacultyResource;
use App\Models\Blog;
use App\Models\Level;
use App\Modules\Blog\Domain\Entities\Post;
use App\Modules\Blog\Domain\Repositories\CategoryRepository;
use App\Modules\Blog\Domain\Repositories\PostRepository;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\CategoryModel;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use App\Services\FacultyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SwitchPageController extends Controller
{
    public function __construct(
        private FacultyService $facultyService,
        private PostRepository $postRepository,
        private CategoryRepository $categoryRepository
    ) {}
    //
    public function home(Request $request)
    {
        $allFaculties = $this->facultyService->getWithLevels();

        $page = $request->input('page', 1);

        $posts = $this->postRepository->getAll(10, $page);
        $categories = $this->categoryRepository->getAll();

        return Inertia::render('Homepage', [
            'faculties' => FacultyResource::collection($allFaculties),
            'posts' => $posts,
            'categories' => $categories,
        ]);
    }

    public function admission()
    {
        $allFaculties = $this->facultyService->getWithLevels();
        return Inertia::render('Admissionpage', [
            'faculties' => FacultyResource::collection($allFaculties),
        ]);
    }

    public function courses(Request $request)
    {
        $allFaculties = $this->facultyService->getWithLevels();

        return Inertia::render('courses/Coursespage', [
            'faculties' => FacultyResource::collection($allFaculties),
        ]);
    }

    public function courseShow($id)
    {
        $course = Level::findOrFail($id);
        $course->load(['faculty', 'admissionConditions', 'detail']);

        $mayLike = Level::where('id', '!=', $course->id)
            ->with(['detail', 'faculty'])
            ->inRandomOrder()
            ->take(4)
            ->get();

        return Inertia::render('courses/CourseShow', [
            'course' => $course,
            'mayLike' => $mayLike
        ]);
    }

    public function about()
    {
        return Inertia::render('Aboutpage');
    }

    public function contact()
    {
        return Inertia::render('Contactpage');
    }

    public function blog(Request $request)
    {
        $q = $request->query('q');
        $sort = $request->query('sort', 'latest'); 
        $category = $request->query('category'); 
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 10);

        $posts = $this->postRepository->getAll($perPage, $page);

        if (method_exists($this->postRepository, 'getFeatured')) {
            $featured = $this->postRepository->getFeatured(3); 
        } else {
            $featuredQuery = PostModel::query()
                ->where('status', 'published')
                ->where('featured', 1)
                ->with(['category:id,name,slug', 'author:id,name,avatar'])
                ->orderBy('published_at', 'desc')
                ->limit(3)
                ->get(['id', 'title', 'excerpt', 'slug', 'main_image_1', 'read_time', 'published_at', 'category_id', 'author_id']);

            $featured = $featuredQuery->map(function ($m) {
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'excerpt' => $m->excerpt,
                    'slug' => $m->slug,
                    'main_image_1' => $m->main_image_1,
                    'read_time' => $m->read_time,
                    'published_at' => $m->published_at?->toIso8601String(),
                    'category' => $m->category ? ['id' => $m->category->id, 'name' => $m->category->name, 'slug' => $m->category->slug] : null,
                    'author' => $m->author ? ['id' => $m->author->id, 'name' => $m->author->name, 'avatar' => $m->author->avatar] : null,
                ];
            })->toArray();
        }

        // categories : normaliser pour sidebar (id, name, count, color)
        if (method_exists($this->categoryRepository, 'getAllWithCount')) {
            $categories = $this->categoryRepository->getAllWithCount();
        } else {
            // fallback : récupérer catégories avec count
            $cats = CategoryModel::withCount('posts')->get(['id', 'name', 'slug', 'color', 'description']);
            $categories = $cats->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug ?? null,
                'count' => $c->posts_count ?? 0,
                'color' => $c->color ?? null,
                'description' => $c->description ?? null,
            ])->toArray();
        }

        // Optionnel : tags populaires (si tu en veux)
        // $tags = Tag::withCount('posts')->orderBy('posts_count','desc')->limit(20)->pluck('name')->toArray();

        // Retour Inertia : posts est déjà un array paginé par ton repository (data/current_page/last_page/...)
        return Inertia::render('Blogpage', [
            'posts' => $posts,          // structure attendue : { data: [...], current_page, last_page, per_page, total }
            'featured' => $featured,    // tableau d'items pour carrousel
            'categories' => $categories,
            // 'tags' => $tags,
            // renvoie aussi les filtres actuels (pratique pour initialiser les contrôles côté client)
            'filters' => [
                'q' => $q,
                'sort' => $sort,
                'category' => $category,
                'page' => $page,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function blogDetails($id)
    {
        $post = PostModel::query()
                ->with(['category', 'author'])
                ->findOrFail($id);

        $incrementViews = $this->postRepository->incrementViews($id);

        if (method_exists($this->categoryRepository, 'getAllWithCount')) {
            $categories = $this->categoryRepository->getAllWithCount();
        } else {
            // fallback : récupérer catégories avec count
            $cats = CategoryModel::withCount('posts')->get(['id', 'name', 'slug', 'color', 'description']);
            $categories = $cats->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug ?? null,
                'count' => $c->posts_count ?? 0,
                'color' => $c->color ?? null,
                'description' => $c->description ?? null,
            ])->toArray();
        }
        return Inertia::render('BlogDetailsPage', [
            'post' => $post,
            'categories' => $categories,
        ]);
    }

    public function politique()
    {
        return Inertia::render('Politiquepage');
    }

    public function condition()
    {
        return Inertia::render('Conditionpage');
    }
}
