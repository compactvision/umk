<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\Courses;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeachingAssignmentService
{
    public function save(array $data, ?int $actorId, ?int $offeringId = null): AcademicOffering
    {
        return DB::transaction(function () use ($data, $actorId, $offeringId) {
            \App\Models\AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $course = Courses::whereKey($data['course_id'])->lockForUpdate()->firstOrFail();
            $offering = $offeringId ? AcademicOffering::lockForUpdate()->findOrFail($offeringId) : new AcademicOffering;
            if ($offeringId && ($offering->course_id != $course->id || $offering->academic_year_id != $data['academic_year_id'])) {
                throw ValidationException::withMessages(['course_id' => 'Le cours et l’année d’une affectation existante ne peuvent pas être changés.']);
            }
            if (!empty($data['professor_id'])) {
                $professor = Professor::whereKey($data['professor_id'])->lockForUpdate()->firstOrFail();
                if (!$professor->is_active) {
                    throw ValidationException::withMessages(['professor_id' => 'Cet enseignant est inactif. Choisissez un enseignant actif.']);
                }
            }
            if ($offeringId && !empty($data['professor_id']) && $offering->professor_id != $data['professor_id']) {
                foreach (\App\Models\Student\AcademicSession::where('academic_offering_id', $offeringId)->get() as $session) {
                    $conflict = \App\Models\Student\AcademicSession::where('academic_offering_id', '!=', $offeringId)
                        ->where('starts_at', '<', $session->ends_at)->where('ends_at', '>', $session->starts_at)
                        ->whereHas('offering', fn ($q) => $q->where('professor_id', $data['professor_id']))->exists();
                    if ($conflict) throw ValidationException::withMessages(['professor_id' => 'Cet enseignant a déjà une séance sur un des créneaux du cours. Modifiez d’abord l’horaire.']);
                }
            }
            $classId = $offeringId ? $offering->class_id : ($data['class_id'] ?? null);
            if ($classId && !\App\Models\Classes::whereKey($classId)->where('level_id', $course->level_id)->exists()) {
                throw ValidationException::withMessages(['class_id' => 'Ce groupe n’appartient pas au niveau du cours.']);
            }
            if (!$offeringId && AcademicOffering::where('course_id', $course->id)->where('academic_year_id', $data['academic_year_id'])->where('class_id', $classId)->exists()) {
                throw ValidationException::withMessages(['academic_year_id' => 'Un enseignement existe déjà pour ce cours, cette année et ce groupe. Modifiez son affectation.']);
            }
            $values = [
                'course_id' => $course->id, 'level_id' => $course->level_id,
                'academic_year_id' => $data['academic_year_id'], 'professor_id' => $data['professor_id'] ?? null,
                'is_published' => $data['is_published'],
            ];
            foreach (['assistant_professor_id', 'group_leader_name', 'delivery_mode'] as $field) {
                if (array_key_exists($field, $data)) $values[$field] = $data[$field];
            }
            if (!$offeringId) {
                $values += ['class_id' => $classId, 'is_optional' => $data['is_optional'] ?? false,
                    'semester' => $data['semester'] ?? match ((int) $course->semester) { 1 => '1er semestre', 2 => '2e semestre', default => null }];
            }
            $offering->fill($values)->save();
            Audit::record($actorId, $offeringId ? 'teaching_assignment_updated' : 'teaching_assignment_created', $offering);
            return $offering;
        });
    }
}
