<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class CorrectionRevision extends Model
{
    protected $table = 'academic_correction_revisions';

    protected $guarded = ['id'];

    protected $hidden = ['snapshot'];

    protected $casts = ['snapshot' => 'array'];

    protected static function booted(): void
    {
        self::updating(fn () => false);
        self::deleting(fn () => false);
    }
}
