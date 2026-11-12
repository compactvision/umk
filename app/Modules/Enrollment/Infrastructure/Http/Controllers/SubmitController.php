<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Enrollment\Application\DTOs\SubmitEnrollmentDTO;
use App\Modules\Enrollment\Application\UseCases\SubmitEnrollmentUseCase;
use App\Modules\Enrollment\Domain\Exceptions\EnrollmentException;
use Illuminate\Http\Request;

class SubmitController extends Controller
{
    public function __construct(
        private readonly SubmitEnrollmentUseCase $submitEnrollmentUseCase
    ) {}

    public function __invoke(Request $request, string $uuid)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $dto = SubmitEnrollmentDTO::fromRequest($uuid, $validated, $request->user()->id);
            $this->submitEnrollmentUseCase->execute($dto);
        } catch (EnrollmentException $exception) {
            return $this->failure($request, $uuid, $exception->getMessage());
        } catch (\Exception $exception) {
            report($exception);

            return $this->failure($request, $uuid, 'Une erreur est survenue lors de la soumission.');
        }

        try {
            app(\App\Modules\Seo\Application\Audience::class)->record('admission_submitted', '/admission');
        } catch (\Exception $exception) {
            report($exception);
        }

        $message = 'Votre dossier a été soumis avec succès. Vous pouvez suivre son traitement ici.';
        if ($request->expectsJson()) {
            $request->session()->flash('success', $message);

            return response()->json(['ok' => true, 'redirect' => route('dashboard.enrollments.index', absolute: false)]);
        }

        return to_route('dashboard.enrollments.index', status: 303)->with('success', $message);
    }

    private function failure(Request $request, string $uuid, string $message)
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $message], 422);
        }

        $editable = $request->user()->enrollments()->where('uuid', $uuid)->where('status', 'draft')
            ->where(fn ($query) => $query->whereNull('draft_expires_at')->orWhere('draft_expires_at', '>', now()))
            ->exists();

        return ($editable
            ? to_route('dashboard.enrollments.edit', ['enrollment' => $uuid], 303)
            : to_route('dashboard.enrollments.index', status: 303))
            ->withErrors(['submit' => $message]);
    }
}
