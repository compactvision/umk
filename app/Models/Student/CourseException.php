<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class CourseException extends Model
{
    protected $table = 'academic_course_exceptions';

    protected $fillable = ['academic_enrollment_id', 'academic_offering_id', 'action', 'reason', 'authorized_by'];

    protected $casts = [];
}
