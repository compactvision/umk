<?php
// app/Models/Enrollment.php (version complète)

namespace App\Models;

use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Enrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'enrollments';

    protected $fillable = [
        'uuid',
        'student_id',
        'level_id',
        'academic_year_id',
        'status',
        'payment_status',
        'enrolled_at',
        'matricule',
        'notes',
        'meta',
        'last_step',
        'form_snapshot',
        'draft_expires_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'form_snapshot' => 'array',
        'draft_expires_at' => 'datetime',
        'enrolled_at' => 'date',
        'status' => EnrollmentStatus::class,
        'payment_status' => PaymentStatus::class,
    ];

    protected $appends = ['status_label', 'payment_status_label'];

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

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
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

    /** ACCESSORS **/
    public function getStatusLabelAttribute(): string
    {
        return $this->status?->label() ?? 'Inconnu';
    }

    public function getPaymentStatusLabelAttribute(): string
    {
        return $this->payment_status?->label() ?? 'Inconnu';
    }

    /** SCOPES **/
    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeDrafts($query)
    {
        return $query->where('status', EnrollmentStatus::DRAFT);
    }

    public function scopePending($query)
    {
        return $query->where('status', EnrollmentStatus::PENDING);
    }

    public function scopeValidated($query)
    {
        return $query->where('status', EnrollmentStatus::VALIDATED);
    }

    public function scopeExpiredDrafts($query)
    {
        return $query->drafts()
            ->where('draft_expires_at', '<', now());
    }

    /** HELPERS **/
    public function isDraft(): bool
    {
        return $this->status === EnrollmentStatus::DRAFT;
    }

    public function isPending(): bool
    {
        return $this->status === EnrollmentStatus::PENDING;
    }

    public function isValidated(): bool
    {
        return $this->status === EnrollmentStatus::VALIDATED;
    }

    public function isRejected(): bool
    {
        return $this->status === EnrollmentStatus::REJECTED;
    }

    public function canBeSubmitted(): bool
    {
        return $this->isDraft() && !$this->isExpired();
    }

    public function isExpired(): bool
    {
        return $this->draft_expires_at && $this->draft_expires_at->isPast();
    }
}