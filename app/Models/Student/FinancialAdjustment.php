<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class FinancialAdjustment extends Model
{
    protected $table = 'student_financial_adjustments';

    protected $fillable = ['academic_enrollment_id', 'type', 'fee_kind', 'feature', 'amount_cents', 'starts_at', 'expires_at', 'is_active', 'reason', 'authorized_by', 'schedule', 'percentage_basis_points', 'funding_source', 'stackable', 'operation_key', 'request_hash'];

    protected $casts = ['is_active' => 'boolean', 'stackable' => 'boolean', 'schedule' => 'array', 'starts_at' => 'date', 'expires_at' => 'date'];

    protected static function booted(): void
    {
        static::updating(function ($model) {
            if (array_diff(array_keys($model->getDirty()), ['is_active', 'updated_at'])) {
                throw ValidationException::withMessages(['adjustment' => 'Une aide approuvée est historique : révoquez-la puis créez une nouvelle décision.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['adjustment' => 'Les aides historiques ne sont pas supprimées.']));
    }
}
