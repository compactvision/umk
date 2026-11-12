<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use LogicException;

final class AcademicOfficialResult extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['snapshot' => 'array'];

    protected static function booted(): void
    {
        self::updating(function (self $result) {
            if ($result->run()->whereIn('state', ['approved', 'published', 'abandoned'])->exists()
                || $result->isDirty(['snapshot', 'reference', 'academic_enrollment_id', 'academic_deliberation_id'])) {
                throw new LogicException('Le dossier calculé ou approuvé est immuable.');
            }
        });
        self::deleting(fn () => false);
    }

    public function run()
    {
        return $this->belongsTo(AcademicDeliberation::class, 'academic_deliberation_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->whereHas('run', fn ($run) => $run->where('state', 'published')->whereNotNull('published_at'));
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }
}
