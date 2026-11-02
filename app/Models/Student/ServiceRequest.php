<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    protected $table = 'student_service_requests';

    protected $fillable = ['academic_enrollment_id', 'category', 'subject', 'body', 'status', 'response', 'responded_by'];

    protected $casts = [];
}
