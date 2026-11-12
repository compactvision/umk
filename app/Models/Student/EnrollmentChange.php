<?php

namespace App\Models\Student;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

final class EnrollmentChange extends Model
{
    public $timestamps = false;

    protected $table = 'academic_enrollment_changes';

    protected $guarded = ['id'];

    protected $casts = ['before' => 'array', 'after' => 'array', 'effective_at' => 'datetime', 'ends_at' => 'datetime', 'created_at' => 'datetime'];

    protected static function booted(): void
    {
        self::updating(fn () => throw ValidationException::withMessages(['change' => 'Une décision publiée est immuable. Enregistrez une nouvelle décision.']));
        self::deleting(fn () => throw ValidationException::withMessages(['change' => 'Les décisions sont conservées.']));
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    public function target()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'target_enrollment_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
