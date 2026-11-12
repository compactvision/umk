<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class StudentObligation extends Model
{
    protected $table = 'student_obligations';

    protected $fillable = ['academic_enrollment_id', 'kind', 'title', 'installment', 'amount_cents', 'due_at', 'currency', 'finance_tariff_id', 'source_snapshot'];

    protected $casts = ['due_at' => 'date', 'source_snapshot' => 'array'];

    protected static function booted(): void
    {
        static::updating(fn () => throw ValidationException::withMessages(['obligation' => 'Les obligations émises sont immuables ; utilisez une décision d’ajustement ou un échéancier.']));
        static::deleting(fn () => throw ValidationException::withMessages(['obligation' => 'Les obligations historiques sont conservées.']));
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }
}
