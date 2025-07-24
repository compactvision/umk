<?php

namespace App\Http\Controllers;

use App\Http\Resources\FacultyResource;
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
    public function contact()
    {
        return Inertia::render('Contactpage');
    }
}
