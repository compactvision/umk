<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AdmissionCondition\Application\UseCases\GetRequirementsFor;
use Illuminate\Http\Request;

class RequirementsController extends Controller
{

    public function __invoke(Request $request, GetRequirementsFor $getRequirementsFor)
    {
        $validated = $request->validate([
            'faculty_id' => ['nullable', 'integer', 'exists:faculties,id'],
            'level_id'   => ['required', 'integer', 'exists:levels,id'],
            // 'year_id' peut être validé ici si tu veux filtrer sur année "open"
        ]);

        $payload = $getRequirementsFor(
            (int) $validated['level_id'],            // ✅ level d’abord
            $validated['faculty_id'] ?? null         // ✅ faculty ensuite (nullable)
        );

        return response()->json(['ok' => true, 'payload' => $payload]);
    }
}
