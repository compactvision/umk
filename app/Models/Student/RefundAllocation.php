<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class RefundAllocation extends Model
{
    public $timestamps = false;

    protected $table = 'student_refund_allocations';

    protected $guarded = ['id'];

    protected static function booted(): void
    {
        static::updating(fn () => throw ValidationException::withMessages(['refund' => 'Cette affectation est immuable.']));
        static::deleting(fn () => throw ValidationException::withMessages(['refund' => 'L’historique des affectations est conservé.']));
    }
}
