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

    protected $hidden = ['invitation_hash', 'photo'];

    protected $casts = ['is_active' => 'boolean', 'invitation_expires_at' => 'datetime'];

    public function portraitDisk(): ?string
    {
        if (preg_match('~^professor-portraits/'.preg_quote((string) $this->id, '~').'/[a-z0-9]+\.(jpe?g|png|webp)$~i', $this->photo ?? '')) {
            return 'local';
        }

        return preg_match('~^professors/[a-z0-9_-]+\.(jpe?g|png|webp)$~i', $this->photo ?? '') ? 'public' : null;
    }

    public function portraitUrl(): ?string
    {
        return $this->portraitDisk() ? route('dashboard.professor-photo', ['professor' => $this->id, 'v' => substr(sha1($this->photo), 0, 12)]) : null;
    }

    public function offerings()
    {
        return $this->hasMany(\App\Models\Student\AcademicOffering::class, 'professor_id');
    }

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

