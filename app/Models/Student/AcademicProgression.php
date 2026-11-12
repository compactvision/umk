<?php

namespace App\Models\Student;

use App\Models\AcademicYear;
use App\Models\Level;
use Illuminate\Database\Eloquent\Model;

class AcademicProgression extends Model
{
    protected $fillable = ['source_enrollment_id', 'target_enrollment_id', 'level_id', 'academic_year_id', 'decided_by', 'reason', 'academic_official_result_id', 'kind', 'decision_snapshot', 'target_curriculum_version_id'];

    protected $casts = ['decision_snapshot' => 'array'];

    public function retakeAssignments()
    {
        return $this->hasMany(AcademicRetakeAssignment::class);
    }

    public function source()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'source_enrollment_id');
    }

    public function target()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'target_enrollment_id');
    }

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
