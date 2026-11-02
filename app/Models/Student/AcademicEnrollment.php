<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicEnrollment extends Model
{
    protected $table = 'academic_enrollments';

    protected $fillable = ['student_profile_id', 'application_id', 'level_id', 'academic_year_id', 'class_id', 'matricule', 'enrollment_status', 'fee_category', 'currency'];

    protected $casts = [];

    public function courseExceptions()
    {
        return $this->hasMany(CourseException::class);
    }

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }

    public function application()
    {
        return $this->belongsTo(\App\Models\Enrollment::class, 'application_id');
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

    public function obligations()
    {
        return $this->hasMany(StudentObligation::class);
    }

    public function payments()
    {
        return $this->hasMany(StudentPayment::class);
    }

    public function adjustments()
    {
        return $this->hasMany(FinancialAdjustment::class);
    }
}
