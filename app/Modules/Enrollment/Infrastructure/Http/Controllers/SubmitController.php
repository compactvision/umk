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
            $enrollment = $this->submitEnrollmentUseCase->execute($dto);

            return redirect()
                ->route('dashboard.enrollments.index')
                ->with('success', 'Inscriptions enregistrer avec succes');
                
        } catch (EnrollmentException $e) {
            return back()->withErrors([
                'submit' => $e->getMessage(),
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'submit' => 'Une erreur est survenue lors de la soumission.',
            ]);
        }
    }
}