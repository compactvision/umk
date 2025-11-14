<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\AcademicYear;
use App\Modules\Enrollment\Application\UseCases\GetDraftUseCase;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    public function __construct(
        private readonly GetDraftUseCase $getDraftUseCase
    ) {}

    public function index(Request $request)
    {
        $enrollments = $request->user()
            ->enrollments()
            ->with(['level.faculty', 'academicYear'])
            ->latest()
            ->paginate(10);

        return Inertia::render('dashboard/enrollments/Index', [
            'enrollments' => $enrollments,
        ]);
    }

    public function create(Request $request)
    {
        $faculties = Faculty::with('levels')->get();
        $years = AcademicYear::where('status', 'open')->get();
        
        // Charger les niveaux groupés par faculté
        $levelsByFaculty = Level::with('faculty')
            ->get()
            ->groupBy('faculty_id')
            ->map(fn($levels) => $levels->values());

        // Récupérer le brouillon existant si disponible
        $draft = $this->getDraftUseCase->execute($request->user()->id);

        return Inertia::render('dashboard/enrollments/Enrollment', [
            'faculties' => $faculties,
            'years' => $years,
            'levelsByFaculty' => $levelsByFaculty,
            'draft' => $draft ? [
                'uuid' => $draft->uuid,
                'last_step' => $draft->last_step,
                'form_snapshot' => $draft->form_snapshot,
            ] : null,
        ]);
    }

    public function show(Request $request, string $uuid)
    {
        $enrollment = $request->user()
            ->enrollments()
            ->with(['level.faculty', 'academicYear', 'documents'])
            ->where('uuid', $uuid)
            ->firstOrFail();

        return Inertia::render('dashboard/enrollments/Show', [
            'enrollment' => $enrollment,
        ]);
    }
}