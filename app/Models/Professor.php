<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Professor extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone', 'gender', 'birth_date',
        'photo', 'faculty_id', 'level_id', 'speciality', 'biography', 'hire_date', 'is_active'
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Courses::class, 'course_professor');
    }
}

