<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Modules\Enrollment\Application\UseCases\ValidateEnrollmentUseCase;
use App\Modules\Enrollment\Application\UseCases\RejectEnrollmentUseCase;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EnrollmentManagementController extends Controller
{
    public function __construct(
        private readonly ValidateEnrollmentUseCase $validateUseCase,
        private readonly RejectEnrollmentUseCase $rejectUseCase
    ) {
        // $this->middleware(['auth', 'admin']);
    }

    public function index(Request $request)
    {
        $query = Enrollment::with(['student', 'level.faculty', 'academicYear'])
            ->latest();

        // Filtres
        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->faculty_id) {
            $query->whereHas('level', fn($q) => $q->where('faculty_id', $request->faculty_id));
        }

        $enrollments = $query->paginate(20);

        return Inertia::render('Admin/Enrollments/Index', [
            'enrollments' => $enrollments,
            'filters' => $request->only(['status', 'faculty_id']),
        ]);
    }

    public function show(int $id)
    {
        $enrollment = Enrollment::with([
            'student',
            'level.faculty',
            'academicYear',
            'documents',
            'events'
        ])->findOrFail($id);

        return Inertia::render('Admin/Enrollments/Show', [
            'enrollment' => $enrollment,
        ]);
    }

    public function validate(Request $request, int $id)
    {
        try {
            $enrollment = $this->validateUseCase->execute($id, $request->user()->id);

            return back()->with('success', 'Inscription validée avec succès');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function reject(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $enrollment = $this->rejectUseCase->execute(
                $id,
                $request->user()->id,
                $validated['reason']
            );

            return back()->with('success', 'Inscription rejetée');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}