<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class AcademicSession extends Model
{
    protected $table = 'academic_sessions';

    protected $fillable = ['academic_offering_id', 'starts_at', 'ends_at', 'room', 'is_published', 'academic_room_id', 'activity_type', 'recurrence_id', 'generation_key', 'validated_at', 'published_at', 'cancelled_at', 'change_reason', 'replaces_session_id', 'attendance_closed_at', 'attendance_revision'];

    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_published' => 'boolean', 'validated_at' => 'datetime', 'published_at' => 'datetime', 'cancelled_at' => 'datetime', 'attendance_closed_at' => 'datetime', 'attendance_revision' => 'integer'];

    public function successor()
    {
        return $this->hasOne(self::class, 'replaces_session_id');
    }

    public function registeredRoom()
    {
        return $this->belongsTo(AcademicRoom::class, 'academic_room_id');
    }

    public function offering()
    {
        return $this->belongsTo(AcademicOffering::class, 'academic_offering_id');
    }
}
