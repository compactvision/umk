<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicStructure\CurriculumItem;
use App\Models\AcademicStructure\CurriculumUnit;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class TeachingOfferingService
{
    public function create(User $actor, array $data): AcademicOffering
    {
        return DB::transaction(function () use ($actor, $data) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $year = AcademicYear::findOrFail($data['academic_year_id']);
            $item = CurriculumItem::with(['unit.version.program.faculty', 'unit.version.cohort.academicYear'])->findOrFail($data['curriculum_item_id']);
            $unit = $item->unit;
            $version = $unit->version;
            $program = $version->program;
            TeachingScope::authorize($actor, (int) $program->faculty_id);
            $course = Courses::lockForUpdate()->findOrFail($item->source_course_id);
            $group = isset($data['class_id']) ? Classes::with('promotion')->findOrFail($data['class_id']) : null;
            $key = hash('sha256', implode(':', [$year->id, $item->id, $group?->id ?? 0]));
            $period = isset($data['academic_semester_id']) ? AcademicSemester::where('academic_year_id', $year->id)->find($data['academic_semester_id']) : null;
            if (isset($data['academic_semester_id']) && (! $period || (preg_match('/^S([12])$/i', $unit->period_code, $match) && (int) $match[1] !== $period->number))) {
                throw ValidationException::withMessages(['academic_semester_id' => 'La période doit correspondre à l’année et à l’UE.']);
            }
            $start = $period?->start_date->toDateString() ?? $data['starts_on'] ?? $year->start_date;
            $end = $period?->end_date->toDateString() ?? $data['ends_on'] ?? $year->end_date;
            $prerequisite = isset($data['required_unit_id']) ? CurriculumUnit::with('version')->findOrFail($data['required_unit_id']) : null;
            if ($old = AcademicOffering::where('teaching_key', $key)->first()) {
                if ((int) $old->academic_semester_id !== (int) $period?->id || (int) $old->required_unit_id !== (int) $prerequisite?->id
                    || (! $period && ($old->starts_on !== $start || $old->ends_on !== $end))) {
                    throw ValidationException::withMessages(['curriculum_item_id' => 'Cette offre existe déjà avec des paramètres différents.']);
                }

                return $old;
            }
            if (! in_array($year->status, ['draft', 'open'], true) || $version->status !== 'published' || ! $version->published_at
                || ($version->academic_year_id !== null && (int) $version->academic_year_id !== (int) $year->id)
                || ($version->cohort && $version->cohort->academicYear->start_date > $year->start_date)
                || ($year->university_id !== null && (int) $year->university_id !== (int) $program->faculty->university_id)
                || ! $program->is_active || ! $program->faculty->is_active || $course->catalog_status !== 'active' || (int) $course->level_id !== (int) $unit->level_id) {
                throw ValidationException::withMessages(['curriculum_item_id' => 'Choisissez un EC actif d’une maquette publiée applicable à cette année.']);
            }
            if ($group && ((int) $group->faculty_id !== (int) $program->faculty_id || (int) $group->level_id !== (int) $unit->level_id || ! $group->promotion
                || (int) $group->promotion->academic_year_id !== (int) $year->id
                || (int) $group->promotion->academic_program_id !== (int) $program->id)) {
                throw ValidationException::withMessages(['class_id' => 'Le groupe doit relever d’une promotion du programme, du niveau et de l’année.']);
            }
            if ($start < $year->start_date || $end > $year->end_date || $end < $start) {
                throw ValidationException::withMessages(['ends_on' => 'La période doit rester dans l’année académique.']);
            }
            if ($prerequisite && ($prerequisite->id === $unit->id || ! $prerequisite->version->published_at
                || (int) $prerequisite->version->academic_program_id !== (int) $program->id)) {
                throw ValidationException::withMessages(['required_unit_id' => 'Le prérequis doit être une autre UE publiée de ce programme.']);
            }
            $overlap = AcademicOffering::where('academic_year_id', $year->id)->where('course_id', $course->id)->whereNull('archived_at')
                ->where(fn ($q) => $q->whereNull('curriculum_item_id')->orWhere('curriculum_item_id', $item->id))
                ->when($group, fn ($q) => $q->where(fn ($q) => $q->whereNull('class_id')->orWhere('class_id', $group->id)))
                ->when($program->academic_department_id, fn ($q, $id) => $q->where(fn ($q) => $q->whereNull('academic_department_id')->orWhere('academic_department_id', $id)))->exists();
            if ($overlap) {
                throw ValidationException::withMessages(['curriculum_item_id' => 'Une offre couvre déjà ce public. Consultez l’offre existante avant toute migration.']);
            }
            $offering = AcademicOffering::create([
                'course_id' => $course->id, 'level_id' => $unit->level_id, 'academic_year_id' => $year->id,
                'class_id' => $group?->id, 'academic_department_id' => $program->academic_department_id,
                'curriculum_item_id' => $item->id, 'academic_semester_id' => $period?->id, 'required_unit_id' => $prerequisite?->id,
                'semester' => $unit->period_name, 'starts_on' => $period ? null : $start, 'ends_on' => $period ? null : $end,
                'teaching_key' => $key, 'is_optional' => $item->is_optional, 'is_published' => false,
            ]);
            Audit::record($actor->id, 'teaching_offering_created', $offering, $data['reason'], ['curriculum_item_id' => $item->id]);

            return $offering;
        }, 3);
    }

    public function transition(AcademicOffering $offering, User $actor, string $action, string $reason): void
    {
        TeachingScope::authorize($actor, (int) $offering->level->faculty_id);
        DB::transaction(function () use ($offering, $actor, $action, $reason) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::lockForUpdate()->findOrFail($offering->id);
            if ($action === 'archive' && $offering->archived_at || $action === 'publish' && $offering->is_published && ! $offering->archived_at) {
                return;
            }
            if ($action === 'publish' && ! $offering->archived_at && $offering->professor?->is_active && in_array($offering->academicYear->status, ['draft', 'open'], true)
                && (! $offering->curriculum_item_id || $offering->curriculumItem->unit->version->published_at)) {
                $offering->update(['is_published' => true]);
            } elseif ($action === 'archive') {
                // Keep publication history; registered students may still consult past sessions.
                $offering->update(['archived_at' => now()]);
            } else {
                throw ValidationException::withMessages(['offering' => 'La publication exige un responsable actif et une offre non archivée dans une année ouverte ou préparée.']);
            }
            Audit::record($actor->id, 'teaching_offering_'.$action, $offering, $reason);
        }, 3);
    }
}
