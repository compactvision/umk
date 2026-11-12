<?php

namespace App\Models\Student;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\Level;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class FinanceTariff extends Model
{
    protected $table = 'finance_tariffs';

    protected $guarded = ['id'];

    protected $casts = ['schedule' => 'array', 'valid_from' => 'date', 'valid_until' => 'date'];

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function program()
    {
        return $this->belongsTo(AcademicProgram::class, 'academic_program_id');
    }

    protected static function booted(): void
    {
        static::updating(function ($model) {
            if (array_diff(array_keys($model->getDirty()), ['status', 'updated_at'])) {
                throw ValidationException::withMessages(['tariff' => 'Créez une nouvelle version du barème.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['tariff' => 'Les barèmes historiques sont conservés.']));
    }
}
