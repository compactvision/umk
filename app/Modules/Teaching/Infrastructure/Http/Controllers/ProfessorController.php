<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\TeachingAssignmentService;
use App\Modules\Teaching\Infrastructure\Http\Requests\SaveProfessorRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfessorController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:150', 'status' => 'nullable|in:active,inactive']);
        $query = Professor::query()->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($s) => $s
            ->where('first_name', 'like', "%{$term}%")->orWhere('last_name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%")->orWhere('speciality', 'like', "%{$term}%")))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('is_active', $status === 'active'));
        return Inertia::render('dashboard/professors/Index', [
            'professors' => $query->withCount('offerings')->orderBy('last_name')->orderBy('first_name')->paginate(12)->withQueryString(),
            'filters' => $filters,
            'stats' => ['total' => Professor::count(), 'active' => Professor::where('is_active', true)->count(), 'assignments' => AcademicOffering::whereNotNull('professor_id')->count()],
            'catalog' => Courses::with('level.faculty:id,name')->orderBy('title')->get(['id', 'level_id', 'title', 'code', 'semester']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'canAssign' => $request->user()->can('publish academic content'),
        ]);
    }

    public function show(Professor $professor, Request $request)
    {
        return Inertia::render('dashboard/professors/Show', [
            'professor' => $professor,
            'professors' => Professor::where('is_active', true)->orWhere('id', $professor->id)->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'is_active']),
            'assignments' => $professor->offerings()->with(['course', 'level.faculty', 'academicYear', 'group.intake'])->orderByDesc('academic_year_id')->get(),
            'catalog' => Courses::with('level.faculty:id,name')->orderBy('title')->get(['id', 'level_id', 'title', 'code', 'semester']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'canAssign' => $request->user()->can('publish academic content'),
        ]);
    }

    public function store(SaveProfessorRequest $request)
    {
        $professor = Professor::create($request->validated());
        Audit::record($request->user()->id, 'professor_created', $professor);
        return back()->with('success', 'Enseignant ajouté. Vous pouvez maintenant l’affecter à des cours.');
    }

    public function update(SaveProfessorRequest $request, Professor $professor)
    {
        $professor->update($request->validated());
        Audit::record($request->user()->id, 'professor_updated', $professor);
        return back()->with('success', 'Enseignant mis à jour.');
    }

    public function assign(Request $request, TeachingAssignmentService $service, ?int $offering = null)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
            'academic_year_id' => 'required|integer|exists:academic_years,id',
            'professor_id' => [$offering ? 'nullable' : 'required', 'integer', Rule::exists('professors', 'id')],
            'is_published' => 'required|boolean',
            'assistant_professor_id' => ['nullable', 'integer', 'different:professor_id', Rule::exists('professors', 'id')->where('is_active', true)],
            'group_leader_name' => 'nullable|string|max:180', 'delivery_mode' => 'sometimes|in:in_person,online,hybrid',
        ]);
        $service->save($data, $request->user()->id, $offering);
        return back()->with('success', 'Affectation enregistrée.');
    }
}
