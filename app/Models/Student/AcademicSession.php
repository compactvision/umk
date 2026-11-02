<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicSession extends Model
{
    protected $table = 'academic_sessions';

    protected $fillable = ['academic_offering_id', 'starts_at', 'ends_at', 'room', 'is_published'];

    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_published' => 'boolean'];

    public function offering()
    {
        return $this->belongsTo(AcademicOffering::class, 'academic_offering_id');
    }
}
