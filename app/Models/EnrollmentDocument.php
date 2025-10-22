<?php

namespace App\Models;

use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class EnrollmentDocument extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'enrollment_documents';

    protected $fillable = [
        'enrollment_id','uuid','type','disk','path','filename',
        'mime','size_bytes','is_temp','key','sha256',
        'verified','verified_by','verified_at','comment','version',
    ];

    protected $casts = [
        'is_temp'   => 'boolean',
        'verified'  => 'boolean',
        'verified_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->uuid ??= (string) Str::uuid();
        });
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /** URL de téléchargement via route protégée */
    public function getSecureUrlAttribute(): string
    {
        // À exposer via un controller signé (temporaryUrl si S3)
        return route('enrollments.documents.download', ['uuid' => $this->uuid]);
    }
}
