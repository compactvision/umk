<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use LogicException;

final class AcademicDeliberation extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['context' => 'array', 'jury' => 'array', 'attendance' => 'array', 'meeting_at' => 'datetime', 'approved_at' => 'datetime', 'published_at' => 'datetime'];

    protected static function booted(): void
    {
        self::updating(function (self $run) {
            if ($run->getOriginal('published_at')) {
                throw new LogicException('La publication officielle est immuable.');
            }
        });
        self::deleting(fn () => false);
    }

    public function rule()
    {
        return $this->belongsTo(AcademicResultRule::class, 'academic_result_rule_id');
    }

    public function results()
    {
        return $this->hasMany(AcademicOfficialResult::class);
    }
}
