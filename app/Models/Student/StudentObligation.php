<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class StudentObligation extends Model
{
    protected $table = 'student_obligations';

    protected $fillable = ['academic_enrollment_id', 'kind', 'title', 'installment', 'amount_cents', 'due_at'];

    protected $casts = ['due_at' => 'date'];
}
