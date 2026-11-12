<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardRequest extends Model
{
    protected $table = 'student_card_requests';

    protected $fillable = ['academic_enrollment_id', 'status', 'decision_note', 'reviewed_by', 'reviewed_at', 'photo_version'];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }
}
