<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class StudentPayment extends Model
{
    protected $table = 'student_payments';

    protected $fillable = ['uuid', 'academic_enrollment_id', 'kind', 'amount_cents', 'currency', 'status', 'method', 'reference', 'recorded_by', 'confirmed_by', 'confirmed_at', 'note'];

    protected $casts = ['confirmed_at' => 'datetime'];

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }
}
