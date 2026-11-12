<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class AssessmentRecord extends Model
{
    public const PARTICIPATION = ['unassessed', 'submitted', 'late_submission', 'not_submitted', 'present', 'late', 'absent', 'excused', 'exempt', 'interrupted', 'invalidated'];

    public const SCORED = ['submitted', 'late_submission', 'present', 'late'];

    protected $table = 'academic_assessment_records';

    protected $guarded = ['id'];

    protected $hidden = ['feedback_path'];

    protected $casts = ['criterion_points' => 'array', 'released_at' => 'datetime'];

    public function assessment()
    {
        return $this->belongsTo(AcademicAssessment::class, 'academic_assessment_id');
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    public function group()
    {
        return $this->belongsTo(AssessmentGroup::class, 'academic_assessment_group_id');
    }

    public function history()
    {
        return $this->hasMany(CorrectionRevision::class, 'academic_assessment_record_id');
    }

    public function handoffs()
    {
        return $this->hasMany(AssessmentHandoff::class, 'academic_assessment_record_id');
    }
}
