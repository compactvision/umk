<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicUnitResult extends Model
{
    protected $fillable = ['academic_enrollment_id', 'curriculum_unit_id', 'score', 'validated'];

    protected $casts = ['score' => 'decimal:2', 'validated' => 'boolean'];
}
