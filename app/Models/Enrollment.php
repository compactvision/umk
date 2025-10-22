<?php

namespace App\Models;

use App\Models\User;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Enums\PaymentStatus;
use App\Models\EnrollmentDocument;
use App\Models\EnrollmentEvent;
use App\Models\EnrollmentRequirement;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Enrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'enrollments';

    protected $fillable = [
        'uuid','student_id','level_id','academic_year_id',
        'status','payment_status','enrolled_at','matricule',
        'notes','meta',
        'last_step','form_snapshot','draft_expires_at',
    ];

    protected $casts = [
        'meta'             => 'array',
        'form_snapshot'    => 'array',
        'draft_expires_at' => 'datetime',
        'enrolled_at'      => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->uuid ??= (string) Str::uuid();
        });
    }

    /** RELATIONS **/
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function level()
    {
        return $this->belongsTo(Level::class, 'level_id');
    }

    public function documents()
    {
        return $this->hasMany(EnrollmentDocument::class);
    }

    public function requirements()
    {
        return $this->hasMany(EnrollmentRequirement::class);
    }

    public function events()
    {
        return $this->hasMany(EnrollmentEvent::class);
    }

    /** HELPERS METIER **/
    public function isSubmittable(): bool
    {
        // ex: vérifier pièces obligatoires présentes et valides
        return $this->status === EnrollmentStatus::DRAFT;
    }

    public function markValidated(?\DateTimeInterface $date = null): void
    {
        $this->status = EnrollmentStatus::VALIDATED;
        $this->enrolled_at = $date ?? now();
    }

    public function scopeForStudent($q, int $studentId)
    {
        return $q->where('student_id', $studentId);
    }
}
