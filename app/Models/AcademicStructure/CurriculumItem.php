<?php

namespace App\Models\AcademicStructure;

use App\Models\Courses;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class CurriculumItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['pedagogical_content' => 'array', 'credits' => 'decimal:2', 'coefficient' => 'decimal:3', 'is_optional' => 'boolean'];

    protected static function booted(): void
    {
        $guard = function (self $item) {
            $parent = CurriculumUnit::findOrFail($item->curriculum_unit_id);
            if ($item->curriculum_version_id !== null && (int) $item->curriculum_version_id !== (int) $parent->curriculum_version_id) {
                throw ValidationException::withMessages(['items' => 'La matière et son unité doivent appartenir à la même version.']);
            }
            $item->curriculum_version_id = $parent->curriculum_version_id;
            $ids = array_filter([$item->curriculum_unit_id, $item->getOriginal('curriculum_unit_id')]);
            if (CurriculumUnit::whereIn('id', $ids)->whereHas('version', fn ($q) => $q->where('status', '!=', 'draft'))->exists()) {
                throw ValidationException::withMessages(['items' => 'Les matières d’une version validée ne peuvent plus être modifiées.']);
            }
        };
        static::saving($guard);
        static::deleting($guard);
    }

    public function unit()
    {
        return $this->belongsTo(CurriculumUnit::class, 'curriculum_unit_id');
    }

    public function sourceCourse()
    {
        return $this->belongsTo(Courses::class, 'source_course_id');
    }
}
