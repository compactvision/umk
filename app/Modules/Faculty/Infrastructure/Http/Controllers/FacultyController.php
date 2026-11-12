<?php

namespace App\Modules\Faculty\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\University;
use App\Models\Faculty;
use App\Modules\Faculty\Application\UseCases\CreateFaculty;
use App\Modules\Faculty\Application\UseCases\DeleteFaculty;
use App\Modules\Faculty\Application\UseCases\UpdateFaculty;
use App\Modules\Faculty\Domain\Exceptions\DuplicateFacultyException;
use App\Modules\Faculty\Domain\Repositories\FacultyRepository;
use App\Modules\Faculty\Infrastructure\Http\Requests\StoreFacultyRequest;
use App\Modules\Faculty\Infrastructure\Http\Requests\UpdateFacultyRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

final class FacultyController extends Controller
{
    public function index(Request $request)
    {
        $selection = $request->validate(['faculty' => 'nullable|integer']);
        $institution = University::where('context_key', 'current')->first(['id', 'name']);
        $viewDepartments = Gate::allows('viewAny', AcademicProgram::class);
        $departmentUniversityId = $viewDepartments ? $institution?->id : null;
        $faculties = Faculty::query()->orderBy('name')
            ->with(['departments' => fn ($query) => $query
                ->whereHas('faculty', fn ($faculty) => $faculty->where('university_id', $departmentUniversityId ?? -1))
                ->orderBy('name')])
            ->with(['levels' => fn ($query) => $query
                ->whereHas('faculty', fn ($faculty) => $faculty->where('university_id', $departmentUniversityId ?? -1))
                ->select('id', 'faculty_id', 'title', 'code')->with('departmentOptions:id,name')->orderBy('code')->orderBy('title')])
            ->get(['id', 'name', 'code', 'description', 'duration_years', 'is_active', 'university_id']);

        return Inertia::render('dashboard/faculties/Index', [
            'faculties' => $faculties,
            'institution' => $institution,
            'selectedFacultyId' => isset($selection['faculty']) ? (int) $selection['faculty'] : null,
            'viewDepartments' => $viewDepartments,
            'manageStructure' => Gate::allows('manage', AcademicProgram::class),
        ]);
    }

    public function store(StoreFacultyRequest $request, CreateFaculty $createFaculty)
    {
        $createFaculty->execute(
            $request->validated()['name'],
            $request->validated()['code'],
            $request->validated()['description'],
            (int) $request->validated()['duration_years'],
            (bool) $request->validated()['is_active']
        );

        return redirect()->route('dashboard.admin.faculties.index')
            ->with('success', 'Faculté créée avec succès.');
    }

    public function update(UpdateFacultyRequest $request, int $id, UpdateFaculty $updateFaculty)
    {
        try {
            $updateFaculty->execute(
                $id,
                $request->validated()['name'],
                $request->validated()['code'],
                $request->validated()['description'],
            (int) $request->validated()['duration_years'],
            (bool) $request->validated()['is_active']
        );

        return redirect()->route('dashboard.admin.faculties.index')
            ->with('success', 'Faculté mise à jour avec succès.');
        } catch (DuplicateFacultyException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }


    public function destroy(int $id, DeleteFaculty $deleteFaculty, FacultyRepository $repository)
    {
        $faculty = $repository->findById($id);

        if (!$faculty) {
            return back()->withErrors(['general' => 'Faculté introuvable.']);
        }

        $levelIds = \App\Models\Level::where('faculty_id', $id)->select('id');
        $enrollmentCount = \Illuminate\Support\Facades\DB::table('enrollments')->whereIn('level_id', $levelIds)->count();
        if ($enrollmentCount > 0) {
            return back()->withErrors(['general' => 'Suppression impossible : cette faculté possède des niveaux liés à '. $enrollmentCount .' inscription(s). Les niveaux et les inscriptions doivent être conservés.']);
        }
        $levelCount = \App\Models\Level::where('faculty_id', $id)->count();
        if ($levelCount > 0) {
            return back()->withErrors(['general' => 'Suppression impossible : cette faculté contient '. $levelCount .' niveau(x) de formation. Supprimez ou réaffectez ces niveaux avant de supprimer la faculté.']);
        }

        if (\App\Models\AcademicStructure\AcademicDepartment::where('faculty_id', $id)->exists() || \App\Models\AcademicStructure\AcademicProgram::where('faculty_id', $id)->exists()) {
            return back()->withErrors(['general' => 'Cette faculté possède des départements ou programmes. Désactivez-la pour conserver son historique.']);
        }
        $deleteFaculty->execute($faculty);

        return redirect()
            ->route('dashboard.admin.faculties.index')
            ->with('success', 'Faculté supprimée avec succès.');
    }

    public function show(int $id)
    {
        $faculty = \App\Models\Faculty::with(['levels' => fn ($query) => $query->orderBy('code')->orderBy('title')])->findOrFail($id);

        return Inertia::render('dashboard/faculties/Show', ['faculty' => $faculty]);
    }
}
