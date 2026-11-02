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
use App\Modules\Seo\Application\PublicPage;

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
        $allFaculties = \App\Models\Faculty::where('is_active', true)->with(['levels' => fn ($query) => $query->where('is_active', true)->select('id', 'faculty_id', 'title')->orderBy('title')])->orderBy('name')->get(['id', 'name', 'description']);

        $posts = PostModel::where('status', 'published')->where(fn ($q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->orderByDesc('published_at')->limit(6)->get(['id', 'title', 'excerpt', 'main_image_1', 'published_at']);
        return app(PublicPage::class)->render('Homepage', [
            'faculties' => ['data' => $allFaculties->map(fn ($faculty) => $faculty->only(['id', 'name', 'description']) + ['levels' => $faculty->levels->map->only(['id', 'title'])])],
            'posts' => ['data' => $posts],
        ]);
    }

    public function admission()
    {
        $allFaculties = $this->facultyService->getWithLevels();
        return app(PublicPage::class)->render('Admissionpage', [
            'faculties' => FacultyResource::collection($allFaculties),
        ]);
    }

    public function courses(Request $request)
    {
        $allFaculties = $this->facultyService->getWithLevels();

        return app(PublicPage::class)->render('courses/Coursespage', [
            'faculties' => FacultyResource::collection($allFaculties),
        ]);
    }

    public function facultyShow(int $id)
    {
        $faculty = \App\Models\Faculty::where('is_active', true)
            ->with(['levels' => fn ($query) => $query->where('is_active', true)->orderBy('code')->orderBy('title'), 'levels.detail'])
            ->findOrFail($id);
        $data = $faculty->only(['id', 'name', 'code', 'description', 'duration_years']);
        $data['levels'] = $faculty->levels->map(fn ($level) => [
            'id' => $level->id, 'title' => $level->title, 'code' => $level->code,
            'description' => $level->description, 'image' => $level->image,
            'detail' => $level->detail?->only(['duration_years', 'language', 'illustration_image', 'course_objective']),
        ]);

        return app(PublicPage::class)->render('faculties/FacultyShow', [
            'faculty' => $data,
            'otherFaculties' => \App\Models\Faculty::where('is_active', true)->where('id', '!=', $id)
                ->orderBy('name')->limit(4)->get(['id', 'name', 'code']),
        ], ['title' => $faculty->name.' — Faculté à Kinshasa', 'description' => $faculty->description ?: 'Découvrez les formations et niveaux de '.$faculty->name.' à l’Université Simon Kimbangu.', 'heading' => $faculty->name]);
    }

    public function courseShow(int $id)
    {
        $course = Level::where('is_active', true)
            ->whereHas('faculty', fn ($query) => $query->where('is_active', true))
            ->with(['faculty', 'detail'])->findOrFail($id);
        $data = $course->only(['id', 'title', 'code', 'description', 'image']);
        $data['faculty'] = $course->faculty->only(['id', 'name', 'code', 'description']);
        $data['detail'] = $course->detail?->only([
            'price', 'price_foreign', 'price_national_first', 'price_national_second', 'price_foreign_first', 'price_foreign_second', 'fees', 'duration_years', 'language', 'courses_number', 'credit_required',
            'has_certificate', 'illustration_image', 'course_objective', 'options',
        ]);
        $data['courses'] = \App\Models\Courses::where('level_id', $course->id)
            ->orderBy('semester')->orderBy('title')
            ->get(['id', 'title', 'code', 'credits', 'semester']);
        $data['admission_conditions'] = $course->admissionConditions()
            ->where(fn ($query) => $query->where('faculty_id', $course->faculty_id)->orWhereNull('faculty_id'))
            ->orderBy('section')->orderBy('id')
            ->get(['id', 'title', 'description', 'section', 'is_required']);

        return app(PublicPage::class)->render('courses/CourseShow', [
            'course' => $data,
            'mayLike' => Level::where('is_active', true)->where('id', '!=', $id)
                ->whereHas('faculty', fn ($query) => $query->where('is_active', true))
                ->with('faculty:id,name')->orderBy('title')->limit(3)
                ->get(['id', 'faculty_id', 'title', 'code', 'image']),
        ], ['title' => $course->title.' — '.$course->faculty->name.' à Kinshasa', 'description' => $course->description ?: 'Découvrez '.$course->title.' en '.$course->faculty->name.' : programme et conditions d’admission à l’USK.', 'heading' => $course->title, 'image' => $course->detail?->illustration_image ?: $course->image, 'schema' => ['@type' => 'Course', 'name' => $course->title, 'description' => $course->description ?: 'Formation de '.$course->faculty->name, 'provider' => ['@id' => app(PublicPage::class)->origin().'/#university']]]);
    }

    public function about()
    {
        return app(PublicPage::class)->render('Aboutpage');
    }

    public function contact()
    {
        return app(PublicPage::class)->render('Contactpage');
    }

    public function blog(Request $request)
    {
        $posts = PostModel::query()
            ->where('status', 'published')
            ->where(fn ($query) => $query->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->with(['category', 'author:id,first_name,last_name'])
            ->orderByDesc('published_at')->orderByDesc('id')
            ->paginate(12)->withQueryString();
        abort_if($posts->currentPage() > $posts->lastPage(), 404);

        return app(PublicPage::class)->render('Blogpage', ['posts' => $posts]);
    }

    public function blogDetails($id)
    {
        $post = PostModel::query()
            ->where('status', 'published')
            ->where(fn ($query) => $query->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->with(['category', 'author:id,first_name,last_name'])->findOrFail($id);
        $this->postRepository->incrementViews($id);

        $related = PostModel::query()
            ->where('status', 'published')->where('id', '!=', $post->id)
            ->where(fn ($query) => $query->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->with('category')->orderByDesc('published_at')->limit(3)
            ->get(['id', 'title', 'excerpt', 'main_image_1', 'video_url', 'published_at', 'category_id']);

        // Render editorial text safely, including older HTML articles.
        $text = preg_replace('/<\/(p|div|h[1-6]|li|blockquote)>|<br\s*\/?\s*>/i', "\n\n", $post->content ?? '');
        $postData = $post->toArray();
        $postData['body_text'] = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return app(PublicPage::class)->render('BlogDetailsPage', ['post' => $postData, 'related' => $related], ['title' => $post->seo_title ?: $post->title, 'description' => $post->seo_description ?: ($post->excerpt ?: \Illuminate\Support\Str::limit($postData['body_text'], 170)), 'heading' => $post->title, 'image' => $post->main_image_1, 'type' => 'article', 'schema' => array_filter(['@type' => 'NewsArticle', 'headline' => $post->title, 'datePublished' => $post->published_at?->toIso8601String(), 'image' => app(PublicPage::class)->absolute($post->main_image_1), 'publisher' => ['@id' => app(PublicPage::class)->origin().'/#university'], 'mainEntityOfPage' => app(PublicPage::class)->origin().'/blog/'.$post->id])]);
    }

    public function politique()
    {
        return app(PublicPage::class)->render('Politiquepage');
    }

    public function condition()
    {
        return app(PublicPage::class)->render('Conditionpage');
    }

    public function tuitions()
    {
        return app(PublicPage::class)->render('Tuitionspage');
    }
}
