<?php

namespace App\Models;

use App\Models\AcademicStructure\CurriculumItem;
use App\Models\Student\AcademicOffering;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class Courses extends Model
{
    protected static function booted(): void
    {
        static::deleting(fn () => throw ValidationException::withMessages(['course' => 'Archivez la matière pour conserver son identifiant.']));
    }

    public function offerings()
    {
        return $this->hasMany(AcademicOffering::class, 'course_id');
    }

    public function curriculumItems()
    {
        return $this->hasMany(CurriculumItem::class, 'source_course_id');
    }

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function professors()
    {
        return $this->belongsToMany(Professor::class, 'course_professor');
    }
}
