<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicResource extends Model
{
    protected $table = 'academic_resources';

    protected $fillable = ['academic_offering_id', 'student_profile_id', 'kind', 'title', 'body', 'disk', 'path', 'filename', 'mime', 'opens_at', 'closes_at', 'is_published', 'url'];

    protected $casts = ['opens_at' => 'datetime', 'closes_at' => 'datetime', 'is_published' => 'boolean'];

    public function offering()
    {
        return $this->belongsTo(AcademicOffering::class, 'academic_offering_id');
    }
}
