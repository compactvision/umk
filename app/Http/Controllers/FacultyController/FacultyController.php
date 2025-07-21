<?php

namespace App\Http\Controllers\FacultyController;

use App\Http\Controllers\Controller;
use App\Http\Requests\Faculty\StoreFacultyRequest;
use App\Http\Requests\Faculty\UpdateFacultyRequest;
use App\Http\Resources\FacultyResource;
use App\Http\Resources\FacultyCollection;
use App\Models\Faculty;
use App\Services\FacultyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FacultyController extends Controller
{
    public function __construct(
        private FacultyService $facultyService
    ) {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(Faculty::class, 'faculty');
    }

    /**
     * Liste des facultés avec pagination
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search',
            'status',
            'duration_years',
            'sort_by',
            'sort_direction'
        ]);

        $perPage = min($request->get('per_page', 15), 100); // Limite à 100

        $faculties = $this->facultyService->getPaginated($filters, $perPage);

        return response()->json(new FacultyCollection($faculties));
    }

    /**
     * Affiche une faculté spécifique
     */
    public function show(Faculty $faculty): JsonResponse
    {
        return response()->json([
            'data' => new FacultyResource($faculty),
            'message' => 'Faculté récupérée avec succès.'
        ]);
    }

    /**
     * Crée une nouvelle faculté
     */
    public function store(StoreFacultyRequest $request): JsonResponse
    {
        try {
            $faculty = $this->facultyService->create($request->validated());

            return response()->json([
                'data' => new FacultyResource($faculty),
                'message' => 'Faculté créée avec succès.'
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la faculté.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Met à jour une faculté
     */
    public function update(UpdateFacultyRequest $request, Faculty $faculty): JsonResponse
    {
        try {
            $updatedFaculty = $this->facultyService->update($faculty, $request->validated());

            return response()->json([
                'data' => new FacultyResource($updatedFaculty),
                'message' => 'Faculté mise à jour avec succès.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la faculté.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprime une faculté
     */
    public function destroy(Faculty $faculty): JsonResponse
    {
        try {
            $this->facultyService->delete($faculty);

            return response()->json([
                'message' => 'Faculté supprimée avec succès.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la faculté.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Active/Désactive une faculté
     */
    public function toggleStatus(Faculty $faculty): JsonResponse
    {
        $this->authorize('update', $faculty);

        try {
            $updatedFaculty = $this->facultyService->toggleStatus($faculty);

            return response()->json([
                'data' => new FacultyResource($updatedFaculty),
                'message' => 'Statut de la faculté modifié avec succès.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du changement de statut.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Liste des facultés actives (pour les selects)
     */
    public function active(): JsonResponse
    {
        $faculties = $this->facultyService->getActive();

        return response()->json([
            'data' => FacultyResource::collection($faculties),
            'message' => 'Facultés actives récupérées avec succès.'
        ]);
    }

    /**
     * Statistiques des facultés
     */
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', Faculty::class);

        $stats = $this->facultyService->getStats();

        return response()->json([
            'data' => $stats,
            'message' => 'Statistiques récupérées avec succès.'
        ]);
    }
}
