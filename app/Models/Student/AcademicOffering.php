<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicOffering extends Model
{
    protected $table = 'academic_offerings';

    protected $fillable = ['course_id', 'level_id', 'academic_year_id', 'class_id', 'professor_id', 'semester', 'is_optional', 'is_published', 'assistant_professor_id', 'group_leader_name', 'delivery_mode'];

    protected $casts = ['is_optional' => 'boolean', 'is_published' => 'boolean'];

    public function course()
    {
        return $this->belongsTo(\App\Models\Courses::class, 'course_id');
    }

    public function level()
    {
        return $this->belongsTo(\App\Models\Level::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(\App\Models\AcademicYear::class);
    }

    public function group()
    {
        return $this->belongsTo(\App\Models\Classes::class, 'class_id');
    }

    public function assistant()
    {
        return $this->belongsTo(\App\Models\Professor::class, 'assistant_professor_id');
    }

    public function professor()
    {
        return $this->belongsTo(\App\Models\Professor::class);
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
