<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AbsenceJustification extends Model
{
    protected $table = 'academic_absence_justifications';

    protected $guarded = ['id'];

    protected $hidden = ['path', 'submission_history'];

    protected $casts = ['revision' => 'integer', 'decided_at' => 'datetime', 'submission_history' => 'array'];

    public function attendance()
    {
        return $this->belongsTo(AcademicAttendance::class, 'academic_attendance_id');
    }
}
