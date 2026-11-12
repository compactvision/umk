<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Classes;
use App\Models\Student\AcademicEnrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AcademicGroupService
{
    public function capacity(Classes $group, User $actor, ?int $capacity, string $reason): void
    {
        abort_unless($actor->hasRole('admin') && $actor->can('manage academic access'), 403);
        DB::transaction(function () use ($group, $actor, $capacity, $reason) {
            $group = Classes::lockForUpdate()->findOrFail($group->id);
            abort_if($actor->academicFaculties()->exists() && ! $actor->academicFaculties()->whereKey($group->faculty_id)->exists(), 403);
            if ($group->status !== 'OPEN' || $group->promotion?->academicYear->status === 'closed') {
                throw ValidationException::withMessages(['capacity' => 'Le groupe ou sa promotion est clôturé.']);
            }
            $occupancy = AcademicEnrollment::where('class_id', $group->id)->whereNotIn('enrollment_status', ['cancelled', 'withdrawn', 'transferred'])
                ->selectRaw('academic_year_id, COUNT(*) as occupied')->groupBy('academic_year_id');
            $maximum = (int) DB::query()->fromSub($occupancy, 'group_occupancy')->max('occupied');
            if ($capacity !== null && $capacity < $maximum) {
                throw ValidationException::withMessages(['capacity' => 'La capacité ne peut pas être inférieure aux affectations annuelles existantes ('.$maximum.').']);
            }
            $before = $group->capacity;
            $group->capacity = $capacity;
            if (! $group->isDirty('capacity')) {
                return;
            }
            $group->save();
            Audit::record($actor->id, 'academic_group_capacity_changed', $group, $reason, ['before' => $before, 'after' => $capacity]);
        }, 3);
    }
}
