<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicAudit extends Model
{
    public function actor()
    {
        return $this->belongsTo(\App\Models\User::class, 'actor_id');
    }

    protected $table = 'academic_audits';

    protected $fillable = ['actor_id', 'action', 'entity_type', 'entity_id', 'reason', 'data'];

    protected $casts = ['data' => 'array'];
}
