<?php

namespace App\Models\Student;

use App\Models\AcademicStructure\AcademicDepartment;
use App\Models\AcademicStructure\CurriculumItem;
use App\Models\AcademicStructure\CurriculumUnit;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Level;
use App\Models\Professor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class AcademicOffering extends Model
{
    protected $table = 'academic_offerings';

    protected $fillable = ['course_id', 'level_id', 'academic_department_id', 'academic_year_id', 'class_id', 'professor_id', 'semester', 'is_optional', 'is_published', 'assistant_professor_id', 'group_leader_name', 'delivery_mode', 'curriculum_item_id', 'academic_semester_id', 'required_unit_id', 'teaching_key', 'starts_on', 'ends_on', 'archived_at'];

    protected $casts = ['is_optional' => 'boolean', 'is_published' => 'boolean', 'archived_at' => 'datetime'];

    protected static function booted(): void
    {
        static::updating(function (self $offering) {
            if ($offering->getOriginal('curriculum_item_id') && $offering->isDirty(['curriculum_item_id', 'academic_semester_id', 'required_unit_id', 'teaching_key', 'starts_on', 'ends_on', 'course_id', 'level_id', 'class_id', 'academic_year_id', 'academic_department_id', 'is_optional'])) {
                throw ValidationException::withMessages(['offering' => 'Le contexte pédagogique d’une offre versionnée est immuable.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['offering' => 'Archivez l’offre en conservant ses activités.']));
    }

    public function curriculumItem()
    {
        return $this->belongsTo(CurriculumItem::class);
    }

    public function requiredUnit()
    {
        return $this->belongsTo(CurriculumUnit::class, 'required_unit_id');
    }

    public function academicSemester()
    {
        return $this->belongsTo(AcademicSemester::class);
    }

    public function assignments()
    {
        return $this->hasMany(TeachingAssignment::class);
    }

    public function registrations()
    {
        return $this->hasMany(CourseRegistration::class);
    }

    public function audienceOverlaps(self $other): bool
    {
        return $this->level_id === $other->level_id
            && $this->academic_year_id === $other->academic_year_id
            && (! $this->class_id || ! $other->class_id || $this->class_id === $other->class_id)
            && (! $this->academic_department_id || ! $other->academic_department_id || $this->academic_department_id === $other->academic_department_id);
    }

    public function teachersOverlap(self $other): bool
    {
        return array_intersect(
            array_filter([$this->professor_id, $this->assistant_professor_id]),
            array_filter([$other->professor_id, $other->assistant_professor_id])
        ) !== [];
    }

    public function department()
    {
        return $this->belongsTo(AcademicDepartment::class, 'academic_department_id');
    }

    public function course()
    {
        return $this->belongsTo(Courses::class, 'course_id');
    }

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function group()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function assistant()
    {
        return $this->belongsTo(Professor::class, 'assistant_professor_id');
    }

    public function professor()
    {
        return $this->belongsTo(Professor::class);
    }

    public function resources()
    {
        return $this->hasMany(AcademicResource::class);
    }

    public function sessions()
    {
        return $this->hasMany(AcademicSession::class);
    }

    public function exceptions()
    {
        return $this->hasMany(CourseException::class, 'academic_offering_id');
    }
}
