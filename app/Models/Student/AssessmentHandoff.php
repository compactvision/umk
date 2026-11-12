<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class AssessmentHandoff extends Model
{
    protected $table = 'academic_assessment_handoffs';

    protected $guarded = ['id'];

    protected $casts = ['payload' => 'array'];

    public function record()
    {
        return $this->belongsTo(AssessmentRecord::class, 'academic_assessment_record_id');
    }

    protected static function booted(): void
    {
        self::updating(fn () => false);
        self::deleting(fn () => false);
    }
}
