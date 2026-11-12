<?php

namespace App\Models\Student;

use App\Modules\Student\Application\Services\FinanceMutation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class PaymentRefund extends Model
{
    protected $table = 'student_payment_refunds';

    protected $guarded = ['id'];

    protected $casts = ['approved_at' => 'datetime', 'executed_at' => 'datetime'];

    public function payment()
    {
        return $this->belongsTo(StudentPayment::class, 'student_payment_id');
    }

    public function allocations()
    {
        return $this->hasMany(RefundAllocation::class, 'student_payment_refund_id');
    }

    protected static function booted(): void
    {
        static::updating(function ($refund) {
            if (! FinanceMutation::allowed() || $refund->getOriginal('status') === 'executed'
                || $refund->isDirty(['student_payment_id', 'amount_cents', 'uuid', 'operation_key', 'reason', 'requested_by'])) {
                throw ValidationException::withMessages(['refund' => 'Les remboursements passent par leur workflow audité et leur montant est immuable.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['refund' => 'Les remboursements historiques sont conservés.']));
    }
}
