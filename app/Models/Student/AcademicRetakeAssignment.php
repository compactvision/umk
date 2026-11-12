<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class AcademicRetakeAssignment extends Model
{
    protected $guarded = ['id'];

    public function registration()
    {
        return $this->belongsTo(CourseRegistration::class, 'course_registration_id');
    }
}
