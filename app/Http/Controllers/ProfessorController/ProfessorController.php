<?php

namespace App\Http\Controllers\ProfessorController;

use App\Http\Controllers\Controller;
use App\Http\Requests\Professor\StoreProfessorRequest;
use App\Http\Resources\ProfessorResource;
use App\Models\Faculty;
use App\Models\Level;
use App\Services\ProfessorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProfessorController extends Controller
{
    public function __construct(
        private ProfessorService $professorService
    ) {}
    //
    public function index()
    {
        return Inertia::render('dashboard/professor/Index');
    }

    public function create()
    {
        $faculties = Faculty::all();
        $levels = Level::all();
        return Inertia::render('dashboard/professor/Professor', [
            'faculties' => $faculties,
            'levels' => $levels,
        ]);
    }


    public function store(StoreProfessorRequest $request)
    {
        try {
            Log::info('Tentative de création de professeur', [
                'data' => $request->validated(),
                'user_id' => auth()->id()
            ]);

            $professor = $this->professorService->create($request->validated());

            Log::info('Professeur créée avec succès', [
                'professor_id' => $professor->id,
                'name' => $professor->last_name
            ]);

            // Pour les requêtes AJAX/API
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Professeur créée avec succès.',
                    'data' => new ProfessorResource($professor)
                ], 201);
            }

            // Pour les requêtes Inertia
            return redirect()->back()->with([
                'success' => 'Professeur créée avec succès.',
                'professor' => new ProfessorResource($professor),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Erreur de validation lors de la création', [
                'errors' => $e->errors(),
                'data' => $request->all()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $e->errors()
                ], 422);
            }

            return back()->withErrors($e->errors())->withInput();

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la professeur', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la création de la professeur.'
                ], 500);
            }

            return back()->withInput()->with('error', 'Erreur lors de la création de la professeur.');
        }
    }
}
