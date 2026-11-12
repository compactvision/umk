<?php

namespace App\Models\Student;

use App\Models\AcademicStructure\CurriculumVersion;
use Illuminate\Database\Eloquent\Model;
use LogicException;

final class AcademicResultRule extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['configuration' => 'array', 'effective_on' => 'date', 'approved_at' => 'datetime'];

    protected static function booted(): void
    {
        self::updating(function (self $rule) {
            if ($rule->getOriginal('approved_at')) {
                throw new LogicException('Le règlement approuvé est immuable.');
            }
        });
        self::deleting(fn () => false);
    }

    public function version()
    {
        return $this->belongsTo(CurriculumVersion::class, 'curriculum_version_id');
    }
}
