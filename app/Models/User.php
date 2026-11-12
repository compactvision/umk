<?php

namespace App\Models;

use App\Models\Student\StudentProfile;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use Illuminate\Auth\MustVerifyEmail; // le trait ajoute hasVerifiedEmail(), markEmailAsVerified()...
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmailContract
{
    use HasRoles, \Illuminate\Database\Eloquent\Factories\HasFactory, MustVerifyEmail, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'last_name',
        'first_name',
        'post_name',
        'gender',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function updateLoginInfo($request)
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);
    }

    public function academicFaculties()
    {
        return $this->belongsToMany(Faculty::class, 'academic_staff_faculties', 'user_id', 'faculty_id');
    }

    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    public function posts()
    {
        return $this->hasMany(PostModel::class, 'author_id');
    }

    public function getFullNameAttribute()
    {
        return $this->first_name.' '.$this->last_name;
    }
}
