<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class AcademicAssessment extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['rubric' => 'array', 'group_work' => 'boolean', 'closed_at' => 'datetime', 'accepts_until' => 'datetime', 'weight' => 'decimal:2'];

    public function resource()
    {
        return $this->belongsTo(AcademicResource::class, 'academic_resource_id');
    }

    public function records()
    {
        return $this->hasMany(AssessmentRecord::class);
    }

    public function groups()
    {
        return $this->hasMany(AssessmentGroup::class);
    }
}
