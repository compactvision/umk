<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class CourseRegistration extends Model
{
    protected $table = 'academic_course_registrations';

    protected $guarded = ['id'];

    protected $casts = ['registered_at' => 'datetime', 'withdrawn_at' => 'datetime'];

    protected static function booted(): void
    {
        static::updating(function (self $registration) {
            if ($registration->getOriginal('withdrawn_at') !== null || array_diff(array_keys($registration->getDirty()), ['withdrawn_at', 'withdrawal_kind', 'active_key', 'updated_at'])) {
                throw ValidationException::withMessages(['registration' => 'Cette inscription pédagogique historique est immuable.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['registration' => 'Les inscriptions pédagogiques sont conservées.']));
    }

    public function retakeAssignment()
    {
        return $this->hasOne(AcademicRetakeAssignment::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    public function offering()
    {
        return $this->belongsTo(AcademicOffering::class, 'academic_offering_id');
    }
}
