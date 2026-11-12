<?php

namespace App\Models\Student;

use App\Models\Professor;
use Illuminate\Database\Eloquent\Model;

class AcademicResourceBlock extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'released_at' => 'datetime'];

    public function room()
    {
        return $this->belongsTo(AcademicRoom::class, 'academic_room_id');
    }

    public function professor()
    {
        return $this->belongsTo(Professor::class);
    }
}
