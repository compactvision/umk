<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Enrollment\Application\DTOs\SaveProgressDTO;
use App\Modules\Enrollment\Application\UseCases\GetDraftUseCase;
use App\Modules\Enrollment\Application\UseCases\SaveProgressUseCase;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

class DraftController extends Controller
{
    public function __construct(
        private readonly SaveProgressUseCase $saveProgressUseCase,
        private readonly GetDraftUseCase $getDraftUseCase
    ) {}

    public function show(Request $request)
    {
        $draft = $this->getDraftUseCase->execute($request->user()->id);

        if (! $draft) {
            return response()->json([
                'ok' => false,
                'message' => 'Aucun brouillon trouvé',
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'draft' => [
                'uuid' => $draft->uuid,
                'last_step' => $draft->last_step,
                'form_snapshot' => $draft->form_snapshot,
                'created_at' => $draft->created_at,
                'updated_at' => $draft->updated_at,
            ],
        ]);
    }

    public function save(Request $request)
    {
        $validated = $request->validate([
            'uuid' => 'nullable|string|uuid',
            'last_step' => 'required|integer|min:1|max:4',
            'form_snapshot' => 'required|array',
            'form_snapshot.faculty_id' => 'nullable|integer|exists:faculties,id',
            'form_snapshot.level_id' => 'nullable|integer|exists:levels,id',
            'form_snapshot.year_id' => 'nullable|integer|exists:academic_years,id',
            'form_snapshot.academic_program_id' => 'nullable|integer|exists:academic_programs,id',
            'form_snapshot.name' => 'nullable|string|max:255',
            'form_snapshot.email' => 'nullable|string|max:254',
            'form_snapshot.program' => 'nullable|string|max:255',
            'form_snapshot.isConfirmed' => 'nullable|boolean',
            'form_snapshot.documents' => 'sometimes|array|max:50',
            'form_snapshot.documents.*' => 'array',
            'form_snapshot.documents.*.uuid' => 'nullable|uuid',
            'form_snapshot.documents.*.size_bytes' => 'nullable|integer|min:0',
            'form_snapshot.documents.*.filename' => 'nullable|string|max:255',
            'form_snapshot.documents.*.mime' => 'nullable|string|max:100',
            'form_snapshot.documents.*.temp' => 'nullable|array',
            'form_snapshot.documents.*.temp.path' => 'nullable|string|max:500',
        ]);

        try {
            $validated['form_snapshot'] = Arr::only($validated['form_snapshot'], [
                'faculty_id', 'level_id', 'year_id', 'academic_program_id', 'name', 'email', 'program', 'documents', 'isConfirmed',
            ]);
            $dto = SaveProgressDTO::fromRequest($validated, $request->user()->id);
            $enrollment = $this->saveProgressUseCase->execute($dto);

            if ($request->expectsJson()) {
                return response()->json(['ok' => true, 'draft' => [
                    'uuid' => $enrollment->uuid,
                    'last_step' => $enrollment->last_step,
                    'form_snapshot' => $enrollment->form_snapshot,
                ]]);
            }

            return back()->with('success', 'Progression sauvegardée');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['ok' => false, 'message' => 'Impossible de sauvegarder le dossier. Réessayez.'], 422);
            }

            return back()->withErrors(['error' => 'Impossible de sauvegarder le dossier. Réessayez.']);
        }
    }
}
