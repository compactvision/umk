<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use App\Modules\Student\Application\Services\AcademicGroupService;
use Illuminate\Http\Request;

final class AcademicGroupController extends Controller
{
    public function capacity(Request $request, Classes $group, AcademicGroupService $service)
    {
        $data = $request->validate(['capacity' => 'nullable|integer|min:0|max:100000', 'reason' => 'required|string|min:10|max:1000']);
        $service->capacity($group, $request->user(), isset($data['capacity']) ? (int) $data['capacity'] : null, $data['reason']);

        return back(303)->with('success', 'Capacité du groupe enregistrée.');
    }
}
