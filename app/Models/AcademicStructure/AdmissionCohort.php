<?php

namespace App\Models\AcademicStructure;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Model;

class AdmissionCohort extends Model
{
    protected $fillable = ['academic_program_id', 'academic_year_id', 'code', 'name', 'is_active', 'revision'];

    protected $casts = ['is_active' => 'boolean', 'revision' => 'integer'];

    public function program()
    {
        return $this->belongsTo(AcademicProgram::class, 'academic_program_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
