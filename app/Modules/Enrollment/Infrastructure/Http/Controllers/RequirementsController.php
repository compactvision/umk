<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Modules\AdmissionCondition\Application\UseCases\GetRequirementsFor;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Enrollment\Domain\Services\EnrollmentValidator;
use Illuminate\Http\Request;

class RequirementsController extends Controller
{
    public function __invoke(Request $request, GetRequirementsFor $getRequirementsFor)
    {
        $validated = $request->validate([
            'faculty_id' => ['nullable', 'integer', 'exists:faculties,id'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
            'year_id' => 'nullable|integer|exists:academic_years,id',
            'academic_program_id' => 'nullable|integer|exists:academic_programs,id',
        ]);

        $program = $validated['academic_program_id'] ?? null;
        if (isset($validated['year_id'])) {
            $context = new Enrollment([
                'level_id' => $validated['level_id'], 'academic_year_id' => $validated['year_id'],
                'form_snapshot' => ['academic_program_id' => $program],
            ]);
            try {
                $program = app(EnrollmentValidator::class)->available($context);
            } catch (InvalidEnrollmentStateException $exception) {
                return response()->json(['ok' => false, 'message' => $exception->getMessage()], 422);
            }
        }

        return response()->json(['ok' => true, 'payload' => $getRequirementsFor(
            (int) $validated['level_id'], $validated['faculty_id'] ?? null, $validated['year_id'] ?? null, $program,
        )]);
    }
}
