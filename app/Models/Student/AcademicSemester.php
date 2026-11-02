<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicSemester extends Model
{
    protected $fillable = ['academic_year_id', 'number', 'start_date', 'end_date'];

    protected $casts = ['number' => 'integer', 'start_date' => 'immutable_date:Y-m-d', 'end_date' => 'immutable_date:Y-m-d'];

    public function academicYear()
    {
        return $this->belongsTo(\App\Models\AcademicYear::class);
    }
}
