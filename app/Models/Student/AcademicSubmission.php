<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicSubmission extends Model
{
    public function resource()
    {
        return $this->belongsTo(AcademicResource::class, 'academic_resource_id');
    }

    protected $table = 'academic_submissions';

    protected $fillable = ['academic_enrollment_id', 'academic_resource_id', 'body', 'path', 'filename', 'version'];

    protected $casts = [];
}
