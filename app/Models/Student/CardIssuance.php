<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardIssuance extends Model
{
    public $timestamps = false;

    protected $table = 'student_card_issuances';

    protected $fillable = ['academic_enrollment_id', 'student_name', 'matricule', 'academic_year', 'template_name', 'printed_at', 'printed_by', 'collected_at', 'collected_by', 'replaced_by_official_id'];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    protected $casts = ['printed_at' => 'datetime', 'collected_at' => 'datetime'];
}
