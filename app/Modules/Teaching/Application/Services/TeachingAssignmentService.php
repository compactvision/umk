<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Level;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeachingAssignmentService
{
    public function save(array $data, ?int $actorId, ?int $offeringId = null): AcademicOffering
    {
        return DB::transaction(function () use ($data, $actorId, $offeringId) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $course = Courses::whereKey($data['course_id'])->lockForUpdate()->firstOrFail();
            $level = Level::lockForUpdate()->findOrFail($course->level_id);
            $offering = $offeringId ? AcademicOffering::lockForUpdate()->findOrFail($offeringId) : new AcademicOffering;
            if ($offeringId && ($offering->course_id != $course->id || $offering->academic_year_id != $data['academic_year_id'])) {
                throw ValidationException::withMessages(['course_id' => 'Le cours et l’année d’une affectation existante ne peuvent pas être changés.']);
            }
            if ($actorId !== null) {
                TeachingScope::authorize(User::findOrFail($actorId), (int) $level->faculty_id);
            }
            if (! $offeringId && $course->catalog_status !== 'active') {
                throw ValidationException::withMessages(['course_id' => 'Une matière inactive ou archivée ne peut pas être planifiée à nouveau.']);
            }
            if ($offering->curriculum_item_id || $offering->archived_at) {
                throw ValidationException::withMessages(['offering' => 'Utilisez la gestion de l’équipe de l’offre versionnée ou non archivée.']);
            }
            $team = app(TeachingTeam::class);
            $previous = $offering->only(['professor_id', 'assistant_professor_id']);
            $assistantId = array_key_exists('assistant_professor_id', $data) ? $data['assistant_professor_id'] : $offering->assistant_professor_id;
            if ($assistantId && (int) $assistantId === (int) ($data['professor_id'] ?? 0)) {
                throw ValidationException::withMessages(['assistant_professor_id' => 'Le responsable et l’assistant doivent être différents.']);
            }
            foreach (['professor_id' => $data['professor_id'] ?? null, 'assistant_professor_id' => $assistantId] as $field => $id) {
                if ($id && (int) $id !== (int) $offering->$field) {
                    if (! Professor::lockForUpdate()->findOrFail($id)->is_active) {
                        throw ValidationException::withMessages([$field => 'Choisissez un enseignant actif.']);
                    }
                    if ($offering->assignments()->where('professor_id', $id)->whereIn('role', ['assistant', 'instructor'])->whereNull('ends_at')->exists()) {
                        throw ValidationException::withMessages([$field => 'Terminez d’abord son autre affectation dans cette équipe.']);
                    }
                    $team->ensureAvailable($offering, (int) $id);
                }
            }
            $classId = $offeringId ? $offering->class_id : ($data['class_id'] ?? null);
            if ($classId && ! Classes::whereKey($classId)->where('level_id', $course->level_id)->exists()) {
                throw ValidationException::withMessages(['class_id' => 'Ce groupe n’appartient pas au niveau du cours.']);
            }
            if ($classId) {
                $promotion = Classes::findOrFail($classId)->promotion;
                $targetYear = $offeringId ? $offering->academic_year_id : $data['academic_year_id'];
                if ($promotion && (int) $promotion->academic_year_id !== (int) $targetYear) {
                    throw ValidationException::withMessages(['class_id' => 'Le groupe est rattaché à une autre année académique.']);
                }
            }
            $departmentId = array_key_exists('academic_department_id', $data)
                ? (isset($data['academic_department_id']) ? (int) $data['academic_department_id'] : null)
                : $offering->academic_department_id;
            $audienceChanged = $departmentId !== $offering->academic_department_id;
            if ($departmentId && $audienceChanged && ! $level->departmentOptions()->where('faculty_id', $level->faculty_id)
                ->where('is_active', true)->whereKey($departmentId)->exists()) {
                throw ValidationException::withMessages(['academic_department_id' => 'Ce département n’est pas ouvert à ce niveau.']);
            }
            if ($offeringId && $audienceChanged && $offering->academic_department_id && $offering->sessions()->exists()) {
                throw ValidationException::withMessages(['academic_department_id' => 'Réaffectez les séances avant de modifier le public de cet enseignement.']);
            }
            if ((! $offeringId || $audienceChanged) && AcademicOffering::where('course_id', $course->id)
                ->where('academic_year_id', $data['academic_year_id'])->where('class_id', $classId)
                ->when($offeringId, fn ($q) => $q->whereKeyNot($offeringId))
                ->whereNull('archived_at')->where('academic_department_id', $departmentId)->exists()) {
                throw ValidationException::withMessages(['academic_year_id' => 'Un enseignement existe déjà pour ce cours, cette année et ce public. Modifiez son affectation.']);
            }
            $values = [
                'course_id' => $course->id, 'level_id' => $course->level_id,
                'academic_year_id' => $data['academic_year_id'], 'professor_id' => $data['professor_id'] ?? null,
                'is_published' => $data['is_published'],
                'academic_department_id' => $departmentId,
            ];
            foreach (['assistant_professor_id', 'group_leader_name', 'delivery_mode'] as $field) {
                if (array_key_exists($field, $data)) {
                    $values[$field] = $data[$field];
                }
            }
            if (! $offeringId) {
                $values += ['class_id' => $classId, 'is_optional' => $data['is_optional'] ?? false,
                    'semester' => $data['semester'] ?? match ((int) $course->semester) {
                        1 => '1er semestre', 2 => '2e semestre', default => null
                    }];
            }
            $offering->fill($values)->save();
            $team->synchronizePointers($offering, $previous, $actorId);
            Audit::record($actorId, $offeringId ? 'teaching_assignment_updated' : 'teaching_assignment_created', $offering, data: ['academic_department_id' => $departmentId]);

            return $offering;
        });
    }
}
