<?php

namespace App\Modules\Faculty\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\Faculty\Application\UseCases\CreateFaculty;
use App\Modules\Faculty\Application\UseCases\DeleteFaculty;
use App\Modules\Faculty\Application\UseCases\ListFaculties;
use App\Modules\Faculty\Application\UseCases\UpdateFaculty;
use App\Modules\Faculty\Domain\Exceptions\DuplicateFacultyException;
use App\Modules\Faculty\Domain\Repositories\FacultyRepository;
use App\Modules\Faculty\Infrastructure\Http\Requests\StoreFacultyRequest;
use App\Modules\Faculty\Infrastructure\Http\Requests\UpdateFacultyRequest;
use Inertia\Inertia;

final class FacultyController extends Controller
{
    public function index(ListFaculties $listFaculties)
    {
        $faculties = $listFaculties->execute(6); // 6 par page

        return Inertia::render('dashboard/faculties/Index', [
            'faculties' => $faculties,
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
        $updateFaculty->execute(
            $id,
            $request->validated()['name'],
            $request->validated()['code'],
            $request->validated()['description'],
            (int) $request->validated()['duration_years'],
            (bool) $request->validated()['is_active']
        );

        return redirect()->route('dashboard.faculties.index')
            ->with('success', 'Faculté mise à jour avec succès.');
    }


    public function destroy(int $id, DeleteFaculty $deleteFaculty, FacultyRepository $repository)
    {
        $faculty = $repository->findById($id);

        if (!$faculty) {
            return back()->withErrors(['general' => 'Faculté introuvable.']);
        }

        $deleteFaculty->execute($faculty);

        return redirect()
            ->route('dashboard.admin.faculties.index')
            ->with('success', 'Faculté supprimée avec succès.');
    }
}
