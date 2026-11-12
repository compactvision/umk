<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class PaymentAllocation extends Model
{
    public $timestamps = false;

    protected $table = 'student_payment_allocations';

    protected $guarded = ['id'];

    public function obligation()
    {
        return $this->belongsTo(StudentObligation::class, 'student_obligation_id');
    }

    public function reversals()
    {
        return $this->hasMany(RefundAllocation::class, 'student_payment_allocation_id');
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw ValidationException::withMessages(['allocation' => 'Cette affectation est immuable.']));
        static::deleting(fn () => throw ValidationException::withMessages(['allocation' => 'L’historique des affectations est conservé.']));
    }
}
