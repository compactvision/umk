<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class AcademicResultDocument extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['document_revoked_at' => 'datetime'];

    public function run()
    {
        return $this->belongsTo(AcademicDeliberation::class, 'academic_deliberation_id');
    }

    public function result()
    {
        return $this->belongsTo(AcademicOfficialResult::class, 'academic_official_result_id');
    }

    protected static function booted(): void
    {
        self::updating(fn (self $document) => ! $document->getOriginal('document_revoked_at')
            && array_diff(array_keys($document->getDirty()), ['document_revoked_at', 'updated_at']) === []);
        self::deleting(fn () => false);
    }
}
