<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    protected $table = 'student_profiles';

    protected $fillable = ['user_id', 'matricule', 'student_status'];

    protected $casts = ['welcome_seen_at' => 'datetime', 'personal_details' => 'array'];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function enrollments()
    {
        return $this->hasMany(AcademicEnrollment::class);
    }
}
