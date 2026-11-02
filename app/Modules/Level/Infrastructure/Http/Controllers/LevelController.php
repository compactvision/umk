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
use App\Modules\Level\Domain\Repositories\LevelRepository;
use Illuminate\Support\Facades\Log;

final class LevelController extends Controller
{
    public function index()
    {
        return Inertia::render('dashboard/levels/Index', [
            'faculties' => \App\Models\Faculty::with('levels')->orderBy('name')->paginate(12)
        ]);
    }

    public function show(int $id, LevelRepository $repo)
    {
        return Inertia::render('dashboard/levels/Show', [
            'level' => $repo->findById($id)
        ]);
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

            return back()->with('success', 'Niveau mis à jour avec succès.');
        } catch (DuplicateLevelCodeException $e) {
            return back()->withErrors(['code' => $e->getMessage()])->withInput();
        } catch (\DomainException $e) {
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
        $deleteLevel->execute($id);

        return redirect()->route('dashboard.admin.levels.index')
            ->with('success', 'Niveau supprimé avec succès');
    }
}
