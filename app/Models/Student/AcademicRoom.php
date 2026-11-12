<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicRoom extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['is_active' => 'boolean', 'capacity' => 'integer'];
}
