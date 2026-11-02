<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicAttendance extends Model
{
    protected $fillable = ['academic_session_id', 'academic_enrollment_id', 'status', 'recorded_by'];
}
