<?php

namespace App\Http\Controllers;

use App\Http\Resources\FacultyResource;
use App\Models\Blog;
use App\Models\Level;
use App\Modules\Blog\Domain\Entities\Post;
use App\Modules\Blog\Domain\Repositories\PostRepository;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use App\Services\FacultyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SwitchPageController extends Controller
{
    public function __construct(
        private FacultyService $facultyService,
        private PostRepository $postRepository
    ) {}
    //
    public function home(Request $request)
    {
        $allFaculties = $this->facultyService->getWithLevels();
        
        $page = $request->input('page', 1);
        
        $posts = $this->postRepository->getAll(10, $page);
        
        return Inertia::render('Homepage', [
            'faculties' => FacultyResource::collection($allFaculties),
            'posts' => $posts,
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

    public function courseShow($id) {
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
    
    public function contact()
    {
        return Inertia::render('Contactpage');
    }

    public function blog()
    {
        $posts = PostModel::all();
        return Inertia::render('Blogpage', [
            'posts' => $posts,
        ]);
    }

    public function blogDetails($id)
    {
        $post = PostModel::findOrFail($id);
        return Inertia::render('BlogDetailsPage', [
            'post' => $post,
        ]);
    }
}
