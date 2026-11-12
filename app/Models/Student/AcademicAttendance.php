<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicAttendance extends Model
{
    protected $fillable = ['academic_session_id', 'academic_enrollment_id', 'status', 'recorded_by', 'academic_course_registration_id'];

    public function session()
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    public function justification()
    {
        return $this->hasOne(AbsenceJustification::class, 'academic_attendance_id');
    }
}
