<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class FinancialAdjustment extends Model
{
    protected $table = 'student_financial_adjustments';

    protected $fillable = ['academic_enrollment_id', 'type', 'fee_kind', 'feature', 'amount_cents', 'starts_at', 'expires_at', 'is_active', 'reason', 'authorized_by', 'schedule'];

    protected $casts = ['is_active' => 'boolean', 'schedule' => 'array', 'starts_at' => 'date', 'expires_at' => 'date'];
}
