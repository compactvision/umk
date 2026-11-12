<?php

namespace App\Modules\Level\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Level\Infrastructure\Http\Requests\UpdateLevelRequest;
use App\Modules\Level\Infrastructure\Http\Requests\StoreLevelRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Modules\Level\Application\UseCases\CreateLevel;
use App\Modules\Level\Application\UseCases\UpdateLevel;
use App\Modules\Level\Application\UseCases\DeleteLevel;
use App\Modules\Level\Domain\Exceptions\DuplicateLevelCodeException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class LevelController extends Controller
{
    public function index()
    {
        return Inertia::render('dashboard/levels/Index', [
            'faculties' => \App\Models\Faculty::with('levels')->orderBy('name')->paginate(12)
        ]);
    }

    public function show(Request $request, int $id)
    {
        \App\Models\Level::findOrFail($id);
        $parameters = ['id' => $id];
        $tab = $request->query('tab');
        if (in_array($tab, ['infos', 'conditions', 'prof', 'cours'], true)) {
            $parameters['tab'] = $tab;
        }

        return to_route('dashboard.admin.levels.details.show', $parameters);
    }

    public function store(StoreLevelRequest $request, CreateLevel $createLevel)
    {
        $validated = $request->validated();

        try {
            $createLevel->execute(
                (int) $validated['faculty_id'],
                $validated['title'],
                $validated['code'],
                $request->file('image'),
                $validated['tag'] ?? null,
                $validated['description'] ?? null,
                (bool) ($validated['is_active'] ?? true)
            );

            // ✅ Inertia-friendly response
            return back()->with('success', 'Niveau créé avec succès.');
        } catch (DuplicateLevelCodeException $e) {
            return back()->withErrors(['code' => $e->getMessage()])->withInput();
        } catch (\Throwable $e) {
            Log::error('Erreur création niveau:', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
            return back()->withErrors(['general' => 'Une erreur est survenue lors de la création.'])->withInput();
        }
    }

    public function update(UpdateLevelRequest $request, int $id, UpdateLevel $updateLevel)
    {
        $validated = $request->validated();

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($id, $validated, $request, $updateLevel) {
                $level = \App\Models\Level::lockForUpdate()->findOrFail($id);
                if ((int) $level->faculty_id !== (int) $validated['faculty_id'] && $level->departmentOptions()->exists()) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['faculty_id' => 'Retirez les choix de département avant de changer la faculté du niveau.']);
                }

                $updateLevel->execute(
                    $id,
                    (int) $validated['faculty_id'],
                    $validated['title'],
                    $validated['code'],
                    $request->file('image'),
                    $validated['tag'] ?? null,
                    $validated['description'] ?? null,
                    (bool) ($validated['is_active'] ?? true)
                );
            });

            return back()->with('success', 'Niveau mis à jour avec succès.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (DuplicateLevelCodeException $e) {
            return back()->withErrors(['code' => $e->getMessage()])->withInput();
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException|\DomainException $e) {
            return back()->withErrors(['general' => 'Niveau introuvable.'])->withInput();
        } catch (\Throwable $e) {
            Log::error('Erreur mise à jour niveau:', [
                'id'      => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
            return back()->withErrors(['general' => 'Une erreur est survenue lors de la mise à jour.'])->withInput();
        }
    }


    public function destroy(int $id, DeleteLevel $deleteLevel)
    {
        \App\Models\Level::findOrFail($id);
        if (\Illuminate\Support\Facades\DB::table('enrollments')->where('level_id', $id)->exists()) {
            return back()->withErrors(['general' => 'Ce niveau est lié à des inscriptions et ne peut pas être supprimé.']);
        }
        if (\Illuminate\Support\Facades\DB::table('academic_program_levels')->where('level_id', $id)->exists() || \Illuminate\Support\Facades\DB::table('curriculum_units')->where('level_id', $id)->exists()) {
            return back()->withErrors(['general' => 'Ce niveau appartient à un programme ou une maquette et doit être conservé. Désactivez-le si nécessaire.']);
        }
        try {
            DB::transaction(fn () => $deleteLevel->execute($id));
        } catch (QueryException $exception) {
            if (! in_array($exception->errorInfo[0] ?? null, ['23000', '23503'], true)) {
                throw $exception;
            }

            return back()->withErrors(['general' => 'Ce niveau est utilisé par une autre fonctionnalité. Désactivez-le si nécessaire.']);
        }

        return redirect()->route('dashboard.admin.levels.index')
            ->with('success', 'Niveau supprimé avec succès');
    }
}
