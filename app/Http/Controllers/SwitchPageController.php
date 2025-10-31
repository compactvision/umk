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
        $allFaculties = $this->facultyService->getWithLevels();
        return Inertia::render('Homepage', [
            'faculties' => FacultyResource::collection($allFaculties),
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
}
