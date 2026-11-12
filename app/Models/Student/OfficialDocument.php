<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use LogicException;

final class OfficialDocument extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['snapshot', 'sha256'];

    protected $casts = ['snapshot' => 'array', 'issued_at' => 'datetime', 'expires_at' => 'datetime',
        'printed_at' => 'datetime', 'delivered_at' => 'datetime', 'revoked_at' => 'datetime'];

    protected static function booted(): void
    {
        self::updating(function (self $document) {
            if ($document->getOriginal('sha256') && array_diff(array_keys($document->getDirty()), ['status', 'printed_at', 'delivered_at', 'revoked_at', 'updated_at'])) {
                throw new LogicException('Les données du document émis sont immuables.');
            }
        });
        self::deleting(fn () => false);
    }

    public function type()
    {
        return $this->belongsTo(OfficialDocumentType::class, 'official_document_type_id');
    }

    public function template()
    {
        return $this->belongsTo(OfficialDocumentTemplate::class, 'official_document_template_id');
    }

    public function enrollment()
    {
        return $this->belongsTo(AcademicEnrollment::class, 'academic_enrollment_id');
    }

    public function request()
    {
        return $this->belongsTo(ServiceRequest::class, 'student_service_request_id');
    }

    public function validity(): string
    {
        return match (true) {
            $this->status !== 'issued' => $this->status,
            $this->expires_at?->isPast() => 'expired',
            $this->type->kind === 'card' && $this->delivered_at === null => 'pending',
            default => 'valid',
        };
    }
}
