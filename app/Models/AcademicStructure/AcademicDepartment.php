<?php

namespace App\Models\AcademicStructure;

use App\Models\Faculty;
use Illuminate\Database\Eloquent\Model;

class AcademicDepartment extends Model
{
    protected $fillable = ['faculty_id', 'code', 'name', 'is_active', 'revision'];

    protected $casts = ['is_active' => 'boolean', 'revision' => 'integer'];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }
}
