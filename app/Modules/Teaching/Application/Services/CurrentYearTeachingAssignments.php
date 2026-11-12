<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CurrentYearTeachingAssignments
{
    public function plan(): array
    {
        $today = now('Africa/Kinshasa')->toDateString();
        $years = AcademicYear::where('status', 'open')->whereDate('start_date', '<=', $today)->whereDate('end_date', '>=', $today)->get();
        if ($years->count() !== 1) throw new RuntimeException('Une seule année académique ouverte doit contenir la date courante. Aucune affectation n’a été modifiée.');
        $year = $years->first();
        $matches = json_decode(file_get_contents(database_path('seeders/data/course-teaching-specialities.json')), true, flags: JSON_THROW_ON_ERROR);
        $professors = Professor::where('is_active', true)->orderBy('id')->get()->groupBy('speciality');
        $existing = AcademicOffering::where('academic_year_id', $year->id)->with('professor:id,first_name,last_name')->get()->groupBy('course_id');
        $specializedCourses = AcademicOffering::whereNotNull('academic_department_id')->distinct()->pluck('course_id')->flip();
        $plan = [];
        foreach (Courses::with('level.faculty')->orderBy('id')->get() as $course) {
            $offerings = $existing->get($course->id, collect());
            if ($offerings->isEmpty() && $specializedCourses->has($course->id)) {
                continue;
            }
            $key = $course->level->faculty->code.':'.$course->level->code.':'.$course->title;
            $speciality = $matches[$key] ?? null;
            $candidates = $speciality ? $professors->get($speciality) : null;
            if (!$candidates || $candidates->isEmpty()) throw new RuntimeException("Aucun enseignant actif de la spécialité attendue pour {$course->title}.");
            // Keep a matching existing lecturer; otherwise use the configured specialist.
            if ($offerings->isEmpty()) {
                $plan[] = ['course_id' => $course->id, 'title' => $course->title, 'level_id' => $course->level_id, 'faculty' => $course->level->faculty->code, 'level' => $course->level->code,
                    'academic_year_id' => $year->id, 'professor_id' => $candidates->first()->id, 'professor' => $candidates->first()->full_name, 'speciality' => $speciality,
                    'offering_id' => null, 'previous_professor_id' => null, 'is_published' => true, 'action' => 'create'];
                continue;
            }
            foreach ($offerings as $offering) {
                $target = $candidates->firstWhere('id', $offering->professor_id) ?? $candidates->first();
                $plan[] = ['course_id' => $course->id, 'title' => $course->title, 'level_id' => $course->level_id, 'faculty' => $course->level->faculty->code, 'level' => $course->level->code,
                    'academic_year_id' => $year->id, 'professor_id' => $target->id, 'professor' => $target->full_name, 'speciality' => $speciality,
                    'offering_id' => $offering->id, 'previous_professor_id' => $offering->professor_id, 'is_published' => $offering->is_published,
                    'action' => $target->id === $offering->professor_id ? 'keep' : 'update'];
            }
        }
        return ['year' => $year->only(['id', 'title']), 'items' => $plan];
    }

    public function apply(): array
    {
        return DB::transaction(function () {
            // Share the calendar lock with assignment and scheduling services.
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $plan = $this->plan();
            foreach ($plan['items'] as $item) {
                if ($item['action'] === 'keep') continue;
                app(TeachingAssignmentService::class)->save([
                    'course_id' => $item['course_id'], 'academic_year_id' => $item['academic_year_id'],
                    'professor_id' => $item['professor_id'], 'is_published' => $item['is_published'],
                ], null, $item['offering_id']);
            }
            return $plan;
        });
    }
}
