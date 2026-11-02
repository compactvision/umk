<?php


namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Enrollment\Application\DTOs\SaveProgressDTO;
use App\Modules\Enrollment\Application\UseCases\GetDraftUseCase;
use App\Modules\Enrollment\Application\UseCases\SaveProgressUseCase;
use Illuminate\Http\Request;

class DraftController extends Controller
{
    public function __construct(
        private readonly SaveProgressUseCase $saveProgressUseCase,
        private readonly GetDraftUseCase $getDraftUseCase
    ) {}

    public function show(Request $request)
    {
        $draft = $this->getDraftUseCase->execute($request->user()->id);

        
        if (!$draft) {
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
        ]);

        try {
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['ok' => false, 'message' => 'Impossible de sauvegarder le dossier. Réessayez.'], 422);
            }
            return back()->withErrors(['error' => 'Impossible de sauvegarder le dossier. Réessayez.']);
        }
    }
}