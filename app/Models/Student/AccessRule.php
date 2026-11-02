<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AccessRule extends Model
{
    protected $table = 'academic_access_rules';

    protected $fillable = ['academic_year_id', 'level_id', 'feature', 'fee_kind', 'mode', 'minimum_cents', 'allow_plan', 'allow_exemption', 'is_active', 'regulation_reference'];

    protected $casts = ['is_active' => 'boolean', 'allow_plan' => 'boolean', 'allow_exemption' => 'boolean'];
}
