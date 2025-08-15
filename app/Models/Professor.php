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

    public function faculties()
    {
        return $this->belongsToMany(Faculty::class, 'faculty_professor');
    }

    public function levels()
    {
        return $this->belongsToMany(Level::class, 'level_professor');
    }

    public function courses()
    {
        return $this->belongsToMany(Courses::class, 'course_professor');
    }

    public function levelCodes()
{
    return $this->belongsToMany(LevelCode::class, 'level_code_professor');
}


    // ✅ Full name utile pour l'affichage
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}

