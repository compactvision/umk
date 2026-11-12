<?php

namespace App\Modules\AcademicStructure\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\University;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class DepartmentOrientationController extends Controller
{
    public function update(Request $request, int $level)
    {
        Gate::authorize('manage', AcademicProgram::class);
        $data = $request->validate(['department_ids' => 'present|array', 'department_ids.*' => 'integer|distinct']);
        $ids = array_map('intval', $data['department_ids']);

        $facultyId = DB::transaction(function () use ($request, $level, $ids) {
            $institution = University::where('context_key', 'current')->firstOrFail();
            $target = Level::whereHas('faculty', fn ($q) => $q->where('university_id', $institution->id))->lockForUpdate()->findOrFail($level);
            $previous = $target->departmentOptions()->pluck('academic_departments.id')->all();
            $added = array_diff($ids, $previous);
            $removed = array_diff($previous, $ids);
            if ($target->faculty->departments()->where('is_active', true)->whereIn('id', $added)->count() !== count($added)) {
                throw ValidationException::withMessages(['department_ids' => 'Choisissez uniquement des départements actifs de cette faculté.']);
            }
            if (AcademicEnrollment::where('level_id', $level)->whereIn('academic_department_id', $removed)->exists()
                || AcademicOffering::where('level_id', $level)->whereIn('academic_department_id', $removed)->exists()) {
                throw ValidationException::withMessages(['department_ids' => 'Un département utilisé par des inscriptions ou des enseignements doit rester associé à ce niveau.']);
            }

            $changes = $target->departmentOptions()->sync($ids);
            if ($changes['attached'] || $changes['detached']) {
                Audit::record($request->user()->id, 'department_options_updated', $target, data: $changes);
            }

            return $target->faculty_id;
        });

        return redirect()->route('dashboard.admin.faculties.index', ['faculty' => $facultyId]);
    }
}
