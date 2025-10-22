<?php

namespace App\Models;

use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EnrollmentRequirement extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'enrollment_requirements';

    protected $fillable = [
        'enrollment_id', 'code', 'message', 'deadline_at', 'fulfilled', 'fulfilled_at',
    ];

    protected $casts = [
        'deadline_at'  => 'datetime',
        'fulfilled'    => 'bool',
        'fulfilled_at' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}
