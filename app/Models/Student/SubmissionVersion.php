<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class SubmissionVersion extends Model
{
    protected $table = 'academic_submission_versions';

    protected $guarded = ['id'];

    protected $hidden = ['path', 'operation_key', 'operation_hash'];

    protected $casts = ['received_at' => 'datetime', 'late' => 'boolean'];

    protected static function booted(): void
    {
        self::updating(fn () => false);
        self::deleting(fn () => false);
    }
}
