<?php

namespace App\Models\AcademicStructure;

use App\Models\AcademicYear;
use App\Models\Student\AcademicEnrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class CurriculumVersion extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['level_reviews'];

    protected $casts = ['program_snapshot' => 'array', 'level_reviews' => 'array', 'periods' => 'array', 'revision' => 'integer', 'validated_at' => 'datetime', 'published_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function (self $version) {
            if ($version->status !== null && $version->status !== 'draft') {
                throw ValidationException::withMessages(['version' => 'Une nouvelle version doit commencer en brouillon.']);
            }
        });
        static::updating(function (self $version) {
            $old = $version->getOriginal('status');
            $transitions = ['draft' => ['validated', 'archived'], 'validated' => ['draft', 'published', 'archived'], 'published' => ['replaced', 'archived'], 'replaced' => ['archived'], 'archived' => []];
            if ($version->isDirty('status') && ! in_array($version->status, $transitions[$old] ?? [], true)) {
                throw ValidationException::withMessages(['version' => 'Transition de maquette interdite.']);
            }
            $mutable = $old === 'validated' ? ['status', 'publication_key', 'revision', 'validated_by', 'published_by', 'validated_at', 'published_at', 'updated_at'] : ['status', 'publication_key', 'revision', 'updated_at'];
            if ($old !== 'draft' && array_diff(array_keys($version->getDirty()), $mutable)) {
                throw ValidationException::withMessages(['version' => 'Le contenu académique validé est immuable. Créez une nouvelle version.']);
            }
        });
        static::deleting(fn () => throw ValidationException::withMessages(['version' => 'Les versions sont conservées dans l’historique.']));
    }

    public function program()
    {
        return $this->belongsTo(AcademicProgram::class, 'academic_program_id');
    }

    public function units()
    {
        return $this->hasMany(CurriculumUnit::class)->orderBy('position')->orderBy('id');
    }

    public function cohort()
    {
        return $this->belongsTo(AdmissionCohort::class, 'admission_cohort_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function enrollments()
    {
        return $this->hasMany(AcademicEnrollment::class);
    }
}
