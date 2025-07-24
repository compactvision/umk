<?php

namespace App\Http\Controllers\LevelController;

use App\Http\Controllers\Controller;
use App\Http\Requests\Level\StoreLevelRequest;
use App\Http\Requests\Level\UpdateLevelRequest;
use App\Http\Resources\FacultyResource;
use App\Http\Resources\LevelResource;
use App\Models\Level;
use App\Services\FacultyService;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LevelController extends Controller
{
    public function __construct(
        private LevelService $levelService, private FacultyService $facultyService
    ){}
    /**
     * Afficher tous les niveaux avec leur faculté
     */
    public function index(Request $request)
    {
        try {
            $facultiesWithLevels = $this->facultyService->getWithLevels();

            if($request->expectsJson()) {
                return LevelResource::collection($facultiesWithLevels);
            }

            return Inertia::render('dashboard/faculty/FacultyShow', [
                'faculties' => FacultyResource::collection($facultiesWithLevels),
//                'pagination' => [
//                    'total' => $levels->total(),
//                    'per_page' => $levels->perPage(),
//                    'current_page' => $levels->currentPage(),
//                    'last_page' => $levels->lastPage(),
//                ],
                'filters' => $request->only(['search', 'status', 'duration_years']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors du chargement des niveaux', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du chargement des données.'
                ], 500);
            }

            return Inertia::render('dashboard/faculty/FacultyShow', [
                'levels' => [],
                'error' => 'Erreur lors du chargement des facultés.'
            ]);
        }
    }

    /**
     * Afficher les niveaux d'une faculté spécifique
     */
    public function byFaculty(Faculty $faculty): Response
    {
        $levels = $faculty->orderedLevels;

        return Inertia::render('Levels/ByFaculty', [
            'faculty' => $faculty,
            'levels' => $levels
        ]);
    }

    /**
     * Formulaire de création
     */
    public function create(): Response
    {
        return Inertia::render('Levels/Create', [
            'faculties' => Faculty::select('id', 'name')->get()
        ]);
    }

    /**
     * Enregistrer un niveau
     */
    public function store(StoreLevelRequest $request)
    {
        try {
            \Log::info('Tentative de création de niveau', [
               'data' => $request->validated(),
               'user_id' => auth()->id()
            ]);

            $validated = $request->validated();

            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('images/levels', 'public');
                $validated['image'] = $path;
            }

            $level = $this->levelService->create($validated);

            \Log::info('Niveau crée avec succès', [
                'level_id' => $level->id,
                'level_name' => $level->level_name
            ]);

            if($request->expectsJson()){
                return response()->json([
                    'success' => true,
                    'message' => 'Niveau créé avec succès',
                    'data' => new LevelResource($level)
                ], 201);
            }

            return redirect()->back()->with([
                'success' => 'Niveaux créé avec succès',
                'level' => new LevelResource($level)
            ]);
        }  catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Erreur de validation lors de la création', [
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
            \Log::error('Erreur lors de la création du niveau', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la création du niveau'
                ], 500);
            }

            return back()->withInput()->with('error', 'Erreur lors de la création du niveau.');
        }
    }

    /**
     * Formulaire d'édition
     */
    public function edit(Level $level): Response
    {
        return Inertia::render('Levels/Edit', [
            'level' => $level->load('faculty'),
            'faculties' => Faculty::select('id', 'name')->get()
        ]);
    }

    /**
     * Mettre à jour un niveau
     */
    public function update(UpdateLevelRequest $request, Level $level)
    {
        try {
            $updatedLevel = $this->levelService->update($level, $request->validated());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Niveau mis à jour avec succès.',
                    'data' => new LevelResource($updatedLevel)
                ]);
            }

            return redirect()->back()->with([
                'success' => 'Niveau mis à jour avec succès.',
                'faculty' => new FacultyResource($updatedLevel)
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du niveau', [
                'level_id' => $level->id,
                'message' => $e->getMessage(),
                'data' => $request->validated()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la mise à jour.'
                ], 500);
            }

            return back()->withInput()->with('error', 'Erreur lors de la mise à jour.');
        }
    }

    /**
     * Supprimer un niveau
     */
    public function destroy(Level $level)
    {
        try {
            $this->levelService->delete($level);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Niveau supprimé avec succès.'
                ]);
            }

            return redirect()->back()->with('success', 'Niveau supprimé avec succès.');

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la suppression du niveau', [
                'level_id' => $level->id,
                'message' => $e->getMessage()
            ]);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la suppression.'
                ], 500);
            }

            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }

    /**
     * Statistiques des niveaux
     */
    public function stats()
    {
        $stats = $this->levelService->getStats();

        return response()->json($stats);
    }

    /**
     * Récupère les niveaux actifs (pour les selects)
     */
    public function active()
    {
        $levels = $this->levelService->getActive();

        return FacultyResource::collection($levels);
    }
}
