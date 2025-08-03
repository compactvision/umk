<?php

namespace App\Http\Controllers\LevelController;

use App\Http\Controllers\Controller;
use App\Http\Requests\Level\StoreLevelRequest;
use App\Http\Requests\Level\UpdateLevelRequest;
use App\Http\Requests\Level\UpdateLevelDetailsRequest;
use App\Http\Resources\FacultyResource;
use App\Http\Resources\LevelResource;
use App\Models\AdmissionConditions;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetails;
use App\Services\FacultyService;
use App\Services\ImageService;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class LevelController extends Controller
{
    public function __construct(
        private LevelService $levelService,
        private FacultyService $facultyService
    ) {}
    /**
     * Afficher tous les niveaux avec leur faculté
     */
    public function index(Request $request)
    {
        try {
            $facultiesWithLevels = $this->facultyService->getWithLevels();

            if ($request->expectsJson()) {
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
            Log::error('Erreur lors du chargement des niveaux', [
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

    public function show(Level $level)
    {
        // Charger les relations nécessaires
        $level->load(['faculty', 'details', 'admissionConditions', 'courses']);

        //        dd($level);

        return Inertia::render('dashboard/faculty/level/LevelShow', [
            'level' => $level
        ]);
    }

    /**
     * Enregistrer un niveau
     */
    public function store(StoreLevelRequest $request, ImageService $imageService)
    {
        try {
            // 📝 Log de la tentative (aucun fichier ici)
            Log::info('Tentative de création de niveau', [
                'data' => $request->except('image'),
                'user_id' => auth()->id(),
            ]);

            // ✅ Données validées (ne contient pas l’image si tu la valides séparément)
            $validated = $request->validated();

            // 📸 Traitement de l’image
            $imagePath = $imageService->resizeAndStore(
                $request->file('image'),
                'levels',
                820,
                460
            );

            // 💾 Ajout de l’image dans les données
            $validated['image'] = $imagePath;

            // 📚 Création du niveau
            $level = $this->levelService->create($validated);

            // ✅ Log succès
            Log::info('Niveau créé avec succès', [
                'level_id' => $level->id,
                'level_name' => $level->level_name,
            ]);

            // 📦 Réponse JSON si API
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Niveau créé avec succès',
                    'data' => new LevelResource($level),
                ], 201);
            }

            // 🔁 Réponse HTML
            return redirect()->back()->with([
                'success' => 'Niveau créé avec succès',
                'level' => new LevelResource($level),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // ⚠️ Log des erreurs (sans fichier)
            Log::warning('Erreur de validation lors de la création', [
                'errors' => $e->errors(),
                'data' => $request->except('image'),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $e->errors(),
                ], 422);
            }

            // 🔁 Retour formulaire sans image
            return back()->withErrors($e->errors())->withInput($request->except('image'));
        } catch (\Exception $e) {
            // 🧨 Log de l’erreur sans sérialiser le fichier
            Log::error('Erreur lors de la création du niveau', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->except('image'),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la création du niveau',
                ], 500);
            }

            // 🔁 Retour formulaire sans image
            return back()->withInput($request->except('image'))
                ->with('error', 'Erreur lors de la création du niveau.');
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
    public function update(UpdateLevelRequest $request, Level $level, ImageService $imageService)
    {
        try {
            $validated = $request->validated();

            if ($request->hasFile('image')) {

                if ($level->image && Storage::disk('public')->exists($level->image)) {
                    Storage::disk('public')->delete($level->image);
                }

                $validated['image'] = $imageService->resizeAndStore(
                    $request->file('image'),
                    'levels',
                    820,
                    460
                );
            }

            // ✅ On passe les données complètes avec image au service
            $updatedLevel = $this->levelService->update($level, $validated);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Niveau mis à jour avec succès.',
                    'data' => new LevelResource($updatedLevel)
                ]);
            }

            return redirect()->back()->with('success', 'Niveau mis à jour avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du niveau', [
                'level_id' => $level->id,
                'message' => $e->getMessage(),
                'data' => $request->validated()
            ]);

            return back()->withInput()->with('error', 'Erreur lors de la mise à jour.');
        }
    }




    public function updateLevelDetails(UpdateLevelDetailsRequest $request, $id, ImageService $imageService)
    {
        try {
            $validated = $request->validated();
            $data = $validated['details'] ?? [];

            

            // ✅ Conversion options en tableau si c'est une string
            if (isset($data['options']) && is_string($data['options'])) {
                $data['options'] = array_map('trim', explode(',', $data['options']));
            }

            // ✅ Gestion de l'image si uploadée
            if ($request->hasFile('details.illustration_image')) {
                Log::info("Nouvelle image détectée pour LevelDetails", [
                    'level_id' => $id,
                    'file'     => $request->file('details.illustration_image')->getClientOriginalName(),
                    'size'     => $request->file('details.illustration_image')->getSize() . ' bytes'
                ]);

                $existing = LevelDetails::where('level_id', $id)->first();
                if ($existing && $existing->illustration_image && Storage::disk('public')->exists($existing->illustration_image)) {
                    Log::info("Suppression de l'ancienne image", [
                        'level_id' => $id,
                        'ancienne_image' => $existing->illustration_image
                    ]);

                    Storage::disk('public')->delete($existing->illustration_image);
                }

                $data['illustration_image'] = $imageService->resizeAndStore(
                    $request->file('details.illustration_image'),
                    'level_illustrations',
                    1290,
                    515
                );

                Log::info("Nouvelle image sauvegardée", [
                    'level_id' => $id,
                    'nouvelle_image' => $data['illustration_image']
                ]);
            }


            // ✅ Récupérer l'existant ou préparer un nouveau
            $details = LevelDetails::firstOrNew(['level_id' => $id]);

            Log::info('Tentative de mise à jour/création LevelDetails', [
                'level_id' => $id,
                'avant'    => $details->exists ? $details->toArray() : 'Nouveau record',
                'après'    => $data
            ]);

            // ✅ Remplir les champs et forcer level_id pour la création
            $details->fill($data);
            $details->level_id = $id;

            if ($details->isDirty() || !$details->exists) {
                $details->save();

                Log::info('LevelDetails sauvegardé', [
                    'level_id' => $id,
                    'après'    => $details->toArray(),
                    'type'     => $details->wasRecentlyCreated ? 'Création' : 'Mise à jour'
                ]);

                return redirect()->back()->with('success', $details->wasRecentlyCreated
                    ? 'Détails créés avec succès.'
                    : 'Détails mis à jour avec succès.');
            }

            return redirect()->back()->with('info', 'Aucune modification détectée.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour/création des LevelDetails', [
                'level_id' => $id,
                'message'  => $e->getMessage(),
                'trace'    => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Une erreur est survenue lors de la mise à jour des détails.');
        }
    }


    public function admissionStore(Request $request)
    {
        try {
            // ✅ Validation
            $validated = $request->validate([
                'faculty_id'   => ['required', 'exists:faculties,id'],
                'level_id'     => ['required', 'exists:levels,id'],
                'title'        => ['required', 'string', 'max:255'],
                'description'  => ['required', 'string'],
            ]);

            // ✅ Création de la condition d'admission
            $condition = AdmissionConditions::create($validated);

            Log::info('Nouvelle condition d\'admission créée', [
                'condition_id' => $condition->id,
                'faculty_id'   => $condition->faculty_id,
                'level_id'     => $condition->level_id,
                'title'        => $condition->title
            ]);

            // 🔁 Réponse Inertia / JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Condition d\'admission ajoutée avec succès.',
                    'data'    => $condition
                ], 201);
            }

            return redirect()->back()->with('success', 'Condition d\'admission ajoutée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la condition d\'admission', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'ajout de la condition d\'admission.'
                ], 500);
            }

            return redirect()->back()->withInput()
                ->with('error', 'Erreur lors de l\'ajout de la condition d\'admission.');
        }
    }

    public function admissionUpdate(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'faculty_id'   => ['required', 'exists:faculties,id'],
                'level_id'     => ['required', 'exists:levels,id'],
                'title'        => ['required', 'string', 'max:255'],
                'description'  => ['required', 'string'],
            ]);

            $condition = AdmissionConditions::findOrFail($id);
            $condition->update($validated);

            Log::info('Condition d\'admission mise à jour', [
                'id' => $condition->id,
                'title' => $condition->title
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Condition mise à jour avec succès',
                    'data' => $condition
                ]);
            }

            return redirect()->back()->with('success', 'Condition mise à jour avec succès');
        } catch (\Exception $e) {
            Log::error('Erreur update condition', ['message' => $e->getMessage()]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la mise à jour de la condition'
                ], 500);
            }

            return redirect()->back()->with('error', 'Erreur lors de la mise à jour de la condition');
        }
    }

    public function admissionDestroy($id)
    {
        try {
            $condition = AdmissionConditions::findOrFail($id);
            $condition->delete();

            Log::info('Condition d\'admission supprimée', ['id' => $id]);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Condition supprimée avec succès'
                ]);
            }

            return redirect()->back()->with('success', 'Condition supprimée avec succès');
        } catch (\Exception $e) {
            Log::error('Erreur suppression condition', ['message' => $e->getMessage()]);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la suppression de la condition'
                ], 500);
            }

            return redirect()->back()->with('error', 'Erreur lors de la suppression de la condition');
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
