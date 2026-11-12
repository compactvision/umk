<?php

namespace App\Models\Student;

use App\Modules\Student\Application\Services\FinanceMutation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class StudentPayment extends Model
{
    protected $table = 'student_payments';

    protected $fillable = ['uuid', 'academic_enrollment_id', 'kind', 'amount_cents', 'currency', 'status', 'method', 'reference', 'recorded_by', 'confirmed_by', 'confirmed_at', 'note', 'receipt_snapshot'];

    protected $casts = ['confirmed_at' => 'datetime', 'receipt_snapshot' => 'array'];

    protected static function booted(): void
    {
        static::updating(function ($payment) {
            if ($payment->isDirty() && ! FinanceMutation::allowed()) {
                throw ValidationException::withMessages(['payment' => 'Les écritures passent par une opération financière autorisée et auditée.']);
            }
            if ($payment->isDirty(['amount_cents', 'currency', 'reference', 'academic_enrollment_id', 'kind']) && $payment->getOriginal('status') !== 'pending') {
                throw ValidationException::withMessages(['payment' => 'Le montant, la devise et l’affectation comptable d’un paiement validé sont immuables.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['payment' => 'Les paiements historiques ne sont pas supprimés.']));
    }

    public function allocations()
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function refunds()
    {
        return $this->hasMany(PaymentRefund::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }
}
