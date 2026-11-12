<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class StudentProfile extends Model
{
    protected $table = 'student_profiles';

    protected $fillable = ['user_id', 'matricule', 'student_status'];

    protected $casts = ['welcome_seen_at' => 'datetime', 'personal_details' => 'array'];

    public function cardPhotoVersion(): ?string
    {
        return $this->photo_path ? hash('sha256', $this->photo_path) : null;
    }

    public function cardPhotoReviews(): HasManyThrough
    {
        return $this->hasManyThrough(CardRequest::class, AcademicEnrollment::class)
            ->whereNotNull('student_card_requests.photo_version');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function enrollments()
    {
        return $this->hasMany(AcademicEnrollment::class);
    }
}
