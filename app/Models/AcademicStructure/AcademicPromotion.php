<?php

namespace App\Models\AcademicStructure;

use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Level;
use Illuminate\Database\Eloquent\Model;

class AcademicPromotion extends Model
{
    protected $fillable = ['academic_program_id', 'academic_year_id', 'level_id', 'code', 'name', 'is_active', 'revision'];

    protected $casts = ['is_active' => 'boolean', 'revision' => 'integer'];

    public function groups()
    {
        return $this->hasMany(Classes::class, 'academic_promotion_id');
    }

    public function program()
    {
        return $this->belongsTo(AcademicProgram::class, 'academic_program_id');
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
