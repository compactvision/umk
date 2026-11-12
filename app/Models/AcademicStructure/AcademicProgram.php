<?php

namespace App\Models\AcademicStructure;

use App\Models\Faculty;
use App\Models\Level;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AcademicProgram extends Model
{
    protected $fillable = ['faculty_id', 'academic_department_id', 'academic_cycle_id', 'code', 'name', 'degree', 'normal_duration', 'is_active', 'revision'];

    protected $casts = ['is_active' => 'boolean', 'revision' => 'integer'];

    public function scopeOpenForAdmission(Builder $query)
    {
        return $query->where('is_active', true)->whereHas('faculty', fn ($q) => $q->where('is_active', true))->whereHas('cycle', fn ($q) => $q->where('is_active', true)->whereHas('university', fn ($q) => $q->where('context_key', 'current')->where('is_active', true)));
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function department()
    {
        return $this->belongsTo(AcademicDepartment::class, 'academic_department_id');
    }

    public function cycle()
    {
        return $this->belongsTo(AcademicCycle::class, 'academic_cycle_id');
    }

    public function levels()
    {
        return $this->belongsToMany(Level::class, 'academic_program_levels')->withPivot('position')->orderBy('academic_program_levels.position');
    }

    public function versions()
    {
        return $this->hasMany(CurriculumVersion::class);
    }
}
