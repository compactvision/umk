<?php

namespace App\Models\Student;

use App\Models\Professor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class TeachingAssignment extends Model
{
    protected $table = 'academic_teaching_assignments';

    protected $guarded = ['id'];

    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime'];

    protected static function booted(): void
    {
        static::updating(function (self $assignment) {
            if ($assignment->getOriginal('ends_at') !== null || array_diff(array_keys($assignment->getDirty()), ['ends_at', 'active_key', 'updated_at'])) {
                throw ValidationException::withMessages(['assignment' => 'Cette affectation historique est immuable.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['assignment' => 'Les affectations sont conservées.']));
    }

    public function offering()
    {
        return $this->belongsTo(AcademicOffering::class, 'academic_offering_id');
    }

    public function professor()
    {
        return $this->belongsTo(Professor::class);
    }
}
