<?php

namespace App\Modules\Level\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
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
    public function index(LevelRepository $repo)
    {
        return Inertia::render('dashboard/levels/Index', [
            'levels' => $repo->findAll()
        ]);
    }

    public function show(int $id, LevelRepository $repo)
    {
        return Inertia::render('dashboard/levels/Show', [
            'level' => $repo->findById($id)
        ]);
    }

    public function store(Request $request, CreateLevel $createLevel)
    {
        $validated = $request->validate([
            'faculty_id'   => 'required|exists:faculties,id',
            'title'        => 'required|string|max:255',
            'code'         => 'required|string|max:10',
            'image'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'tag'          => 'nullable|string|max:50',
            'description'  => 'nullable|string',
            'is_active'    => 'nullable|boolean',
        ]);

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

    public function update(Request $request, int $id, UpdateLevel $updateLevel)
    {
        $validated = $request->validate([
            'faculty_id'   => 'required|exists:faculties,id',
            'title'        => 'required|string|max:255',
            'code'         => 'required|string|max:10',
            'image'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'tag'          => 'nullable|string|max:50',
            'description'  => 'nullable|string',
            'is_active'    => 'nullable|boolean',
        ]);

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
        $deleteLevel->execute($id);

        return redirect()->route('dashboard.admin.faculties.index')
            ->with('success', 'Niveau supprimé avec succès');
    }
}
