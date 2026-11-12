<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class AssessmentGroup extends Model
{
    protected $table = 'academic_assessment_groups';

    protected $guarded = ['id'];

    public function records()
    {
        return $this->hasMany(AssessmentRecord::class, 'academic_assessment_group_id');
    }
}
