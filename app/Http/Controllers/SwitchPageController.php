<?php

namespace App\Http\Controllers;

use App\Http\Resources\FacultyResource;
use App\Models\Level;
use App\Services\FacultyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SwitchPageController extends Controller
{
    public function __construct(
        private FacultyService $facultyService
    ) {}
    //
    public function home()
    {
        return Inertia::render('Homepage');
    }

    public function admission()
    {
        return Inertia::render('Admissionpage');
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
        $course->load(['faculty', 'admissionConditions', 'details', 'courses' ]);

        $mayLike = Level::where('id', '!=', $course->id)
            ->with(['details', 'faculty'])
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
}
