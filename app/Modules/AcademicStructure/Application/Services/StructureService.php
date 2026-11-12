<?php

namespace App\Modules\AcademicStructure\Application\Services;

use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\AcademicDepartment;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\AdmissionCohort;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Site;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class StructureService
{
    public function current(): University
    {
        return University::where('context_key', 'current')->firstOrFail();
    }

    public function program(int $id): AcademicProgram
    {
        return AcademicProgram::with(['faculty', 'cycle', 'levels'])->whereHas('faculty', fn ($q) => $q->where('university_id', $this->current()->id))->findOrFail($id);
    }

    public function year(int $id): AcademicYear
    {
        $year = AcademicYear::findOrFail($id);
        abort_unless($year->university_id === null || (int) $year->university_id === $this->current()->id, 404);

        return $year;
    }

    public function save(string $kind, array $data, User $actor, ?int $id = null): Model
    {
        Gate::forUser($actor)->authorize('manage', AcademicProgram::class);

        return DB::transaction(function () use ($kind, $data, $actor, $id) {
            $institution = University::where('context_key', 'current')->lockForUpdate()->first();
            if ($kind === 'university') {
                $model = $institution ?? new University(['context_key' => 'current']);
                $fields = ['code', 'name', 'acronym', 'site_id', 'is_active'];
            } else {
                if (! $institution) {
                    throw ValidationException::withMessages(['university' => 'Configurez d’abord l’identité institutionnelle.']);
                }
                if ($kind === 'group-promotion') {
                    $promotion = AcademicPromotion::findOrFail($data['academic_promotion_id']);
                    $program = $this->program($promotion->academic_program_id);
                    $group = Classes::lockForUpdate()->findOrFail($id);
                    if ((int) $group->faculty_id !== (int) $program->faculty_id || (int) $group->level_id !== (int) $promotion->level_id || ($group->academic_promotion_id !== null && (int) $group->academic_promotion_id !== $promotion->id)) {
                        throw ValidationException::withMessages(['group' => 'Ce groupe ne correspond pas à la promotion ou possède déjà un rattachement historique.']);
                    }
                    if (AcademicOffering::where('class_id', $group->id)->where('academic_year_id', '!=', $promotion->academic_year_id)->exists() || AcademicEnrollment::where('class_id', $group->id)->where('academic_year_id', '!=', $promotion->academic_year_id)->exists()) {
                        throw ValidationException::withMessages(['group' => 'Ce groupe est déjà utilisé dans une autre année. Conservez son contexte historique.']);
                    }
                    if (AcademicEnrollment::where('class_id', $group->id)->where(fn ($entries) => $entries
                        ->whereHas('curriculumVersion', fn ($q) => $q->where('academic_program_id', '!=', $program->id))
                        ->orWhereHas('promotion', fn ($q) => $q->where('academic_program_id', '!=', $program->id))
                        ->orWhereHas('admissionCohort', fn ($q) => $q->where('academic_program_id', '!=', $program->id)))->exists()) {
                        throw ValidationException::withMessages(['group' => 'Une inscription de ce groupe suit déjà un autre programme.']);
                    }
                    $group->forceFill(['academic_promotion_id' => $promotion->id])->save();
                    Audit::record($actor->id, 'promotion_group_attached', $group, $data['reason'], ['academic_promotion_id' => $promotion->id]);

                    return $group;
                }
                if (in_array($kind, ['faculty-context', 'year-context'], true)) {
                    $model = $kind === 'faculty-context' ? Faculty::lockForUpdate()->findOrFail($id) : AcademicYear::lockForUpdate()->findOrFail($id);
                    abort_unless($model->university_id === null || (int) $model->university_id === $institution->id, 404);
                    $model->forceFill(['university_id' => $institution->id])->save();
                    Audit::record($actor->id, 'institution_context_attached', $model, $data['reason']);

                    return $model;
                }
                [$class, $fields] = match ($kind) {
                    'department' => [AcademicDepartment::class, ['faculty_id', 'code', 'name', 'is_active']],
                    'cycle' => [AcademicCycle::class, ['code', 'name', 'normal_duration', 'progression_mode', 'weighting_mode', 'periods', 'is_active']],
                    'program' => [AcademicProgram::class, ['faculty_id', 'academic_department_id', 'academic_cycle_id', 'code', 'name', 'degree', 'normal_duration', 'is_active']],
                    'cohort' => [AdmissionCohort::class, ['academic_program_id', 'academic_year_id', 'code', 'name', 'is_active']],
                    'promotion' => [AcademicPromotion::class, ['academic_program_id', 'academic_year_id', 'level_id', 'code', 'name', 'is_active']],
                };
                $model = $id ? $class::lockForUpdate()->findOrFail($id) : new $class;
                if ($model->exists) {
                    $owner = match ($kind) {
                        'cycle' => (int) $model->university_id,
                        'department', 'program' => (int) Faculty::findOrFail($model->faculty_id)->university_id,
                        default => (int) $this->program($model->academic_program_id)->faculty->university_id,
                    };
                    abort_unless($owner === $institution->id, 404);
                }
                if (in_array($kind, ['department', 'program'], true)) {
                    Faculty::where('university_id', $institution->id)->findOrFail($data['faculty_id']);
                    if ($model->exists && (int) $model->faculty_id !== (int) $data['faculty_id']) {
                        throw ValidationException::withMessages(['faculty_id' => 'Le propriétaire d’un référentiel existant ne peut pas être remplacé.']);
                    }
                }
                if ($kind === 'cycle') {
                    $model->university_id = $institution->id;
                }
                if ($kind === 'program') {
                    AcademicCycle::where('university_id', $institution->id)->findOrFail($data['academic_cycle_id']);
                    if (! empty($data['academic_department_id'])) {
                        AcademicDepartment::where('faculty_id', $data['faculty_id'])->findOrFail($data['academic_department_id']);
                    }
                    $ids = array_map('intval', $data['level_ids']);
                    if (Level::where('faculty_id', $data['faculty_id'])->whereIn('id', $ids)->count() !== count($ids)) {
                        throw ValidationException::withMessages(['level_ids' => 'Tous les niveaux doivent appartenir à la faculté du programme.']);
                    }
                    if ($model->exists && $model->versions()->whereHas('units', fn ($q) => $q->whereNotIn('level_id', $ids))->exists()) {
                        throw ValidationException::withMessages(['level_ids' => 'Un niveau utilisé par une maquette doit être conservé.']);
                    }
                }
                if (in_array($kind, ['cohort', 'promotion'], true)) {
                    $program = $this->program($data['academic_program_id']);
                    $this->year($data['academic_year_id']);
                    if ($model->exists && ((int) $model->academic_program_id !== $program->id || (int) $model->academic_year_id !== (int) $data['academic_year_id'])) {
                        throw ValidationException::withMessages(['academic_program_id' => 'Le contexte historique ne peut pas être changé.']);
                    }
                    if ($kind === 'promotion' && ! $program->levels->contains('id', (int) $data['level_id'])) {
                        throw ValidationException::withMessages(['level_id' => 'Ce niveau n’appartient pas au programme.']);
                    }
                    if ($kind === 'promotion' && $model->exists && (int) $model->level_id !== (int) $data['level_id']) {
                        throw ValidationException::withMessages(['level_id' => 'Le niveau historique de la promotion ne peut pas être changé.']);
                    }
                }
            }
            if ((int) ($data['revision'] ?? -1) !== (int) ($model->revision ?? 0)) {
                throw ValidationException::withMessages(['revision' => 'Le référentiel a changé. Rechargez la page.']);
            }
            $model->fill(Arr::only($data, $fields));
            if ($kind === 'university') {
                $contacts = Arr::only($data, ['address', 'contact_email', 'contact_phone']);
                if ($contacts !== [] && $model->site_id) {
                    Site::lockForUpdate()->findOrFail($model->site_id)->update($contacts);
                } elseif (array_filter($contacts, fn ($value) => filled($value))) {
                    $model->site_id = Site::create(['site_name' => $model->name] + $contacts)->id;
                }
            }
            $model->code = strtoupper(trim($model->code));
            $model->revision = (int) ($model->revision ?? 0) + 1;
            $model->save();
            if ($kind === 'program') {
                $model->levels()->sync(collect($data['level_ids'])->mapWithKeys(fn ($value, $index) => [(int) $value => ['position' => $index + 1]])->all());
            }
            Audit::record($actor->id, 'academic_structure_'.$kind.'_saved', $model, $data['reason'], ['revision' => $model->revision]);

            return $model;
        });
    }
}
