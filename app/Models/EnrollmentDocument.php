<?php
// app/Models/EnrollmentDocument.php (version complète)

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EnrollmentDocument extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'enrollment_documents';

    protected $fillable = [
        'enrollment_id',
        'uuid',
        'type',
        'disk',
        'path',
        'filename',
        'mime',
        'size_bytes',
        'is_temp',
        'key',
        'sha256',
        'verified',
        'review_status',
        'verified_by',
        'verified_at',
        'comment',
        'version',
    ];

    protected $casts = [
        'is_temp' => 'boolean',
        'verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    protected $appends = ['size_human', 'download_url'];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->uuid ??= (string) Str::uuid();
        });

        static::deleting(function (self $model) {
            // Supprimer le fichier physique lors de la suppression
            if ($model->path && Storage::disk($model->disk)->exists($model->path)) {
                Storage::disk($model->disk)->delete($model->path);
            }
        });
    }

    /** RELATIONS **/
    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /** ACCESSORS **/
    public function getSizeHumanAttribute(): string
    {
        $bytes = $this->size_bytes;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getDownloadUrlAttribute(): string
    {
        return route('dashboard.enrollments.documents.download', $this->uuid);
    }

    /** HELPERS **/
    public function isImage(): bool
    {
        return str_starts_with($this->mime, 'image/');
    }

    public function isPdf(): bool
    {
        return $this->mime === 'application/pdf';
    }

    public function exists(): bool
    {
        return Storage::disk($this->disk)->exists($this->path);
    }
}