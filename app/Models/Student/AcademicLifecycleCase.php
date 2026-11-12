<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use LogicException;

final class AcademicLifecycleCase extends Model
{
    public const KINDS = ['interruption', 'resumption', 'reorientation', 'external_transfer', 'cycle', 'graduation'];

    protected $guarded = ['id'];

    protected $hidden = ['pending_key', 'operation_key', 'completion_key'];

    protected $casts = ['context' => 'array', 'decided_at' => 'datetime'];

    protected static function booted(): void
    {
        self::updating(function (self $case) {
            if (in_array($case->getOriginal('status'), ['approved', 'refused'], true)) {
                throw new LogicException('Une décision académique finale est immuable.');
            }
        });
        self::deleting(fn () => false);
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    public function result()
    {
        return $this->belongsTo(AcademicOfficialResult::class, 'academic_official_result_id');
    }
}
