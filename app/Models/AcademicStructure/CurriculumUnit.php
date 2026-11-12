<?php

namespace App\Models\AcademicStructure;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class CurriculumUnit extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['expected_credits' => 'decimal:2'];

    protected static function booted(): void
    {
        $guard = function (self $unit) {
            $ids = array_filter([$unit->curriculum_version_id, $unit->getOriginal('curriculum_version_id')]);
            if (CurriculumVersion::whereIn('id', $ids)->where('status', '!=', 'draft')->exists()) {
                throw ValidationException::withMessages(['units' => 'Les unités d’une version validée ne peuvent plus être modifiées.']);
            }
        };
        static::saving($guard);
        static::deleting($guard);
    }

    public function version()
    {
        return $this->belongsTo(CurriculumVersion::class, 'curriculum_version_id');
    }

    public function items()
    {
        return $this->hasMany(CurriculumItem::class)->orderBy('id');
    }
}
