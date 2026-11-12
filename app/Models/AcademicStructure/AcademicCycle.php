<?php

namespace App\Models\AcademicStructure;

use Illuminate\Database\Eloquent\Model;

class AcademicCycle extends Model
{
    protected $fillable = ['university_id', 'code', 'name', 'normal_duration', 'progression_mode', 'weighting_mode', 'periods', 'is_active', 'revision'];

    protected $casts = ['periods' => 'array', 'is_active' => 'boolean', 'revision' => 'integer'];

    public function university()
    {
        return $this->belongsTo(University::class);
    }
}
