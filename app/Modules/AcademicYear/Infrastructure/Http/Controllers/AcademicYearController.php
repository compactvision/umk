<?php

namespace App\Modules\AcademicYear\Infrastructure\Http\Controllers;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\AcademicYear\Application\UseCases\CreateAcademicYear;
use App\Modules\AcademicYear\Application\UseCases\ListAcademicYears;
use App\Modules\AcademicYear\Application\UseCases\OpenAcademicYear;
use App\Modules\AcademicYear\Application\UseCases\CloseAcademicYear;
use App\Modules\AcademicYear\Application\UseCases\UpdateAcademicYear;
use App\Modules\AcademicYear\Domain\Exceptions\DuplicateAcademicYearException;
use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use App\Modules\AcademicYear\Infrastructure\Http\Requests\CreateAcademicYearRequest;
use App\Modules\AcademicYear\Infrastructure\Http\Requests\UpdateAcademicYearRequest;
use App\Modules\AcademicYear\Infrastructure\Http\Resources\AcademicYearResource;
use DomainException;
use Illuminate\Http\RedirectResponse;

class AcademicYearController extends Controller
{
    public function index(ListAcademicYears $listAcademicYears)
    {
        $years = $listAcademicYears->execute();

        return Inertia::render('dashboard/academicYear/Index', [
            'academicYears' => AcademicYearResource::collection($years),
        ]);
    }

    public function show(int $id, AcademicYearRepository $academicYearRepository)
    {
        $year = $academicYearRepository->findById($id);

        if (!$year) {
            abort(404, 'Année académique introuvable');
        }

        return Inertia::render('dashboard/academicYear/Show', [
            'academicYear' => AcademicYearResource::make($year),
            'enrollmentStats' => (function () use ($id) {
                $counts = \App\Models\Enrollment::where('academic_year_id', $id)->selectRaw('status, COUNT(*) AS total')->groupBy('status')->pluck('total', 'status');
                return [
                    'total' => (int) $counts->sum(),
                    'validated' => (int) ($counts['validated'] ?? 0),
                    'pending' => (int) ($counts['pending'] ?? 0) + (int) ($counts['submitted'] ?? 0),
                    'draft' => (int) ($counts['draft'] ?? 0),
                ];
            })(),
            'enrollments' => \App\Models\Enrollment::where('academic_year_id', $id)
                ->with(['student:id,first_name,last_name', 'level:id,title,code'])
                ->orderByDesc('id')->paginate(8)->withQueryString()
                ->through(fn ($enrollment) => [
                    'id' => $enrollment->id,
                    'student_name' => trim(($enrollment->student?->first_name ?? '').' '.($enrollment->student?->last_name ?? '')) ?: 'Candidat',
                    'level_title' => $enrollment->level?->title,
                    'level_code' => $enrollment->level?->code,
                    'status' => $enrollment->status->value,
                    'status_label' => $enrollment->status->label(),
                ]),
        ]);
    }



    public function store(CreateAcademicYearRequest $request, CreateAcademicYear $createAcademicYear)
    {
        try {
            $createAcademicYear->execute(
                $request->validated()['title'],
                $request->validated()['start_date'],
                $request->validated()['end_date']
            );

            return redirect()
                ->route('dashboard.admin.academic-years.index')
                ->with('success', 'Année académique créée avec succès.');
        } catch (DuplicateAcademicYearException $e) {
            // Cette exception est un "filet de sécurité" au cas où la contrainte DB saute malgré la validation
            return back()->withErrors(['title' => $e->getMessage()]);
        } catch (\Throwable $e) {
            return back()->withErrors(['general' => 'Une erreur est survenue.']);
        }
    }

    public function update(int $id, UpdateAcademicYearRequest $request, UpdateAcademicYear $updateAcademicYear)
    {
        try {
            $validated = $request->validated(); 

            $updateAcademicYear->execute(
                $id,
                $validated['title'],
                new \DateTimeImmutable($validated['start_date']),
                new \DateTimeImmutable($validated['end_date'])
            );

            return back()
                ->with('success', 'Année académique mise à jour avec succès.');
        } catch (DomainException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    public function open(int $id, OpenAcademicYear $useCase): RedirectResponse
    {
        try {
            $useCase->execute($id);

            return back()
                ->with('success', "Année académique ouverte avec succès.");
        } catch (DomainException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    public function close(int $id, CloseAcademicYear $closeAcademicYear)
    {
        try {
            $closeAcademicYear->execute($id);

            return back()
                ->with('success', 'Année académique clôturée');
        } catch (DomainException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }
}
