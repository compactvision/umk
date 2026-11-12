<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AcademicResource extends Model
{
    public const CONTENT_KINDS = ['material', 'syllabus', 'online', 'video', 'audio'];

    public const EDITION_FIELDS = ['title', 'body', 'url', 'disk', 'path', 'filename', 'mime', 'size_bytes', 'sha256'];

    protected $table = 'academic_resources';

    protected $fillable = ['academic_offering_id', 'student_profile_id', 'kind', 'title', 'body', 'disk', 'path', 'filename', 'mime', 'opens_at', 'closes_at', 'is_published', 'url',
        'academic_content_section_id', 'academic_session_id', 'supplementary_for_id', 'author_id', 'position',
        'revision', 'current_version', 'size_bytes', 'sha256', 'published_at', 'archived_at', 'operation_key', 'operation_hash'];

    protected $hidden = ['path', 'disk', 'operation_key', 'operation_hash'];

    protected $casts = ['opens_at' => 'datetime', 'closes_at' => 'datetime', 'is_published' => 'boolean', 'archived_at' => 'datetime', 'published_at' => 'datetime',
        'revision' => 'integer', 'current_version' => 'integer', 'download_count' => 'integer'];

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('is_published', true)->whereNull('archived_at')
            ->where(fn ($q) => $q->whereNull('supplementary_for_id')->orWhereHas('supplementaryFor', fn ($parent) => $parent
                ->where('is_published', true)->whereNull('archived_at')->whereNull('student_profile_id')
                ->whereColumn($parent->qualifyColumn('academic_offering_id'), 'academic_resources.academic_offering_id')));
    }

    public function scopeForStudent(Builder $query, AcademicEnrollment $entry): Builder
    {
        return $query->where(fn ($q) => $q->whereNull('student_profile_id')->orWhere('student_profile_id', $entry->student_profile_id))
            ->where(fn ($q) => $q->where('kind', '!=', 'result')->orWhere('student_profile_id', $entry->student_profile_id));
    }

    public function scopeForLearningPermissions(Builder $query, array $permissions): Builder
    {
        foreach (['assignment' => 'assignments_submit', 'evaluation' => 'evaluations_participate'] as $kind => $feature) {
            if (! ($permissions[$feature]['allowed'] ?? false)) {
                $query->whereDoesntHave('supplementaryFor', fn ($parent) => $parent->where('kind', $kind));
            }
        }

        return $query;
    }

    public function section()
    {
        return $this->belongsTo(ContentSection::class, 'academic_content_section_id');
    }

    public function session()
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function supplementaryFor()
    {
        return $this->belongsTo(self::class, 'supplementary_for_id');
    }

    public function versions()
    {
        return $this->hasMany(ResourceVersion::class, 'academic_resource_id');
    }

    public function submissions()
    {
        return $this->hasMany(AcademicSubmission::class, 'academic_resource_id');
    }

    public function assessment()
    {
        return $this->hasOne(AcademicAssessment::class, 'academic_resource_id');
    }

    public function offering()
    {
        return $this->belongsTo(AcademicOffering::class, 'academic_offering_id');
    }
}
