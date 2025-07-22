<?php

namespace App\Http\Controllers\FacultyController;

use App\Http\Controllers\Controller;
use App\Http\Requests\Faculty\StoreFacultyRequest;
use App\Http\Requests\Faculty\UpdateFacultyRequest;
use App\Http\Resources\FacultyResource;
use App\Models\Faculty;
use App\Services\FacultyService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultyController extends Controller
{
    public function __construct(
        private FacultyService $facultyService
    ) {}

    /**
     * Affiche la liste des facultés
     */
    public function index(Request $request)
    {
        try {
            $faculties = $this->facultyService->getPaginated(
                filters: $request->only(['search', 'status', 'duration_years', 'sort_by', 'sort_direction']),
                perPage: $request->get('per_page', 15)
            );

            // Si c'est une requête AJAX/API, retourner JSON
            if ($request->expectsJson()) {
                return FacultyResource::collection($faculties);
            }

            // Pour la première charge, récupérer toutes les facultés (pas de pagination côté client)
            $allFaculties = $this->facultyService->getActive();

            // Sinon, retourner la vue Inertia avec toutes les facultés
            return Inertia::render('dashboard/faculty/Faculty', [
                'faculties' => FacultyResource::collection($allFaculties),
                'pagination' => [
                    'total' => $faculties->total(),
                    'per_page' => $faculties->perPage(),
                    'current_page' => $faculties->currentPage(),
                    'last_page' => $faculties->lastPage(),
                ],
                'filters' => $request->only(['search', 'status', 'duration_years']),
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur lors du chargement des facultés', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du chargement des données.'
                ], 500);
            }

            return Inertia::render('dashboard/faculty/Faculty', [
                'faculties' => [],
                'error' => 'Erreur lors du chargement des facultés.'
            ]);
        }
    }

    /**
     * Affiche le formulaire de création
     */
    public function create(): Response
    {
        return Inertia::render('dashboard/faculty/Create');
    }

    /**
     * Crée une nouvelle faculté
     */
    public function store(StoreFacultyRequest $request)
    {
        try {
            \Log::info('Tentative de création de faculté', [
                'data' => $request->validated(),
                'user_id' => auth()->id()
            ]);

            $faculty = $this->facultyService->create($request->validated());

            \Log::info('Faculté créée avec succès', [
                'faculty_id' => $faculty->id,
                'name' => $faculty->name
            ]);

            // Pour les requêtes AJAX/API
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Faculté créée avec succès.',
                    'data' => new FacultyResource($faculty)
                ], 201);
            }

            // Pour les requêtes Inertia
            return redirect()->back()->with([
                'success' => 'Faculté créée avec succès.',
                'faculty' => new FacultyResource($faculty),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
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
            \Log::error('Erreur lors de la création de la faculté', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la création de la faculté.'
                ], 500);
            }

            return back()->withInput()->with('error', 'Erreur lors de la création de la faculté.');
        }
    }

    /**
     * Affiche une faculté spécifique
     */
    public function show(Faculty $faculty)
    {
        if (request()->expectsJson()) {
            return new FacultyResource($faculty);
        }

        return Inertia::render('dashboard/faculty/Show', [
            'faculty' => new FacultyResource($faculty)
        ]);
    }

    /**
     * Affiche le formulaire d'édition
     */
    public function edit(Faculty $faculty): Response
    {
        return Inertia::render('dashboard/faculty/Edit', [
            'faculty' => new FacultyResource($faculty)
        ]);
    }

    /**
     * Met à jour une faculté
     */
    public function update(UpdateFacultyRequest $request, Faculty $faculty)
    {
        try {
            $updatedFaculty = $this->facultyService->update($faculty, $request->validated());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Faculté mise à jour avec succès.',
                    'data' => new FacultyResource($updatedFaculty)
                ]);
            }

            return redirect()->back()->with([
                'success' => 'Faculté mise à jour avec succès.',
                'faculty' => new FacultyResource($updatedFaculty)
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour de la faculté', [
                'faculty_id' => $faculty->id,
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
     * Supprime une faculté
     */
    public function destroy(Faculty $faculty)
    {
        try {
            $this->facultyService->delete($faculty);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Faculté supprimée avec succès.'
                ]);
            }

            return redirect()->back()->with('success', 'Faculté supprimée avec succès.');

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la suppression de la faculté', [
                'faculty_id' => $faculty->id,
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
     * Récupère les facultés actives (pour les selects)
     */
    public function active()
    {
        $faculties = $this->facultyService->getActive();

        return FacultyResource::collection($faculties);
    }

    /**
     * Active/Désactive une faculté
     */
    public function toggleStatus(Faculty $faculty)
    {
        try {
            $updatedFaculty = $this->facultyService->toggleStatus($faculty);

            $message = $updatedFaculty->is_active ? 'Faculté activée.' : 'Faculté désactivée.';

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => new FacultyResource($updatedFaculty)
                ]);
            }

            return redirect()->back()->with('success', $message);

        } catch (\Exception $e) {
            \Log::error('Erreur lors du changement de statut', [
                'faculty_id' => $faculty->id,
                'message' => $e->getMessage()
            ]);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du changement de statut.'
                ], 500);
            }

            return back()->with('error', 'Erreur lors du changement de statut.');
        }
    }

    /**
     * Statistiques des facultés
     */
    public function stats()
    {
        $stats = $this->facultyService->getStats();

        return response()->json($stats);
    }
}
