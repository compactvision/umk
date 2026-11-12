<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicProgression;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Modules\Progression\Application\AcademicLifecycle;
use App\Modules\Progression\Application\ProgressionEvidence;
use App\Modules\Progression\Application\ProgressionNotice;
use App\Modules\Results\Application\ResultInputs;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class AcademicProgressionService
{
    public function __construct(private StudentFinanceService $finance, private CurriculumService $curricula, private ProgressionEvidence $evidence) {}

    public function eligible(AcademicEnrollment $source): bool
    {
        return in_array($source->enrollment_status, ['confirmed', 'completed'], true)
            && $source->application?->status?->value === 'validated';
    }

    public function levels(AcademicEnrollment $source)
    {
        $query = Level::where('faculty_id', $source->level->faculty_id)->where('is_active', true);
        $program = $source->curriculumVersion?->program;
        if ($program) {
            $ordered = collect($source->curriculumVersion->program_snapshot['level_order'] ?? $program->levels()->pluck('levels.id')->all());
            $position = $ordered->search($source->level_id);
            $query->whereIn('id', array_filter([$source->level_id, $position === false ? null : $ordered->get($position + 1)]));
        }

        return $query->orderBy('title');
    }

    public function years(AcademicEnrollment $source)
    {
        return AcademicYear::where('start_date', '>', $source->academicYear->end_date)
            ->whereIn('status', ['draft', 'open'])->orderBy('start_date');
    }

    public function decide(AcademicEnrollment $source, User $actor, array $data): void
    {
        abort_unless($actor->hasRole('admin') && $actor->can('publish academic content'), 403);
        Gate::forUser($actor)->authorize('view', $source);
        DB::transaction(function () use ($source, $actor, $data) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            AcademicYear::whereIn('id', [$source->academic_year_id, $data['academic_year_id']])->orderBy('id')->lockForUpdate()->get();
            StudentProfile::lockForUpdate()->findOrFail($source->student_profile_id);
            $source = AcademicEnrollment::lockForUpdate()->findOrFail($source->id);
            $existing = AcademicProgression::where('source_enrollment_id', $source->id)->first();
            $official = app(ResultInputs::class)->latest($source);
            $sameDestination = $existing && (int) $existing->level_id === (int) $data['level_id']
                && (int) $existing->academic_year_id === (int) $data['academic_year_id'];
            if ($sameDestination && $existing->academic_official_result_id === $official?->id) {
                return;
            }
            if ($existing && ($existing->target_enrollment_id !== null || ! $official || $existing->academic_official_result_id === $official->id)) {
                throw ValidationException::withMessages(['level_id' => 'Une décision de passage existe déjà pour cette inscription.']);
            }
            if (AcademicLifecycle::interrupted($source) || ! $this->eligible($source) || ! $this->levels($source)->whereKey($data['level_id'])->exists()) {
                throw ValidationException::withMessages(['level_id' => 'Ce passage ne correspond pas au parcours de l’étudiant.']);
            }
            if (! $this->years($source)->whereKey($data['academic_year_id'])->exists()
                || $source->profile->enrollments()->where('academic_year_id', $data['academic_year_id'])->exists()) {
                throw ValidationException::withMessages(['academic_year_id' => 'Choisissez une année ultérieure sans inscription existante.']);
            }
            $kind = (int) $data['level_id'] === $source->level_id ? 'repeat' : 'advance';
            $snapshot = null;
            if ($source->curriculum_version_id || $official || isset($data['academic_official_result_id'])) {
                $assessment = $this->evidence->evaluate($source, $official);
                $mode = $assessment['mode'];
                if ($assessment['status'] !== 'eligible' || $official->id !== (int) ($data['academic_official_result_id'] ?? 0)
                    || ! in_array($mode, ['same', 'next', 'conditional'], true)
                    || ($mode === 'same') !== ($kind === 'repeat')) {
                    throw ValidationException::withMessages(['level_id' => 'La destination doit correspondre à la dernière décision officielle.']);
                }
                $due = $data['due_on'] ?? null;
                $snapshot = $this->evidence->snapshot($source, $official, $assessment['decision'], $due);
                if ($mode === 'conditional') {
                    $year = AcademicYear::findOrFail($data['academic_year_id']);
                    if (! $due || $due < $year->start_date || $due > $year->end_date || $snapshot['retakes'] === []) {
                        throw ValidationException::withMessages(['due_on' => 'Le passage conditionnel exige des reprises et une échéance comprise dans l’année cible.']);
                    }
                    $kind = 'conditional';
                }
            }
            $version = isset($data['target_curriculum_version_id'])
                ? $this->targetVersions($source, (int) $data['academic_year_id'], (int) $data['level_id'])->findOrFail($data['target_curriculum_version_id'])
                : null;
            $previous = $existing?->only(['level_id', 'academic_year_id', 'academic_official_result_id', 'kind', 'decision_snapshot', 'target_curriculum_version_id']);
            $decision = $existing ?? new AcademicProgression(['source_enrollment_id' => $source->id]);
            $decision->fill([
                'level_id' => $data['level_id'], 'academic_year_id' => $data['academic_year_id'], 'reason' => $data['reason'],
                'decided_by' => $actor->id, 'kind' => $kind, 'decision_snapshot' => $snapshot,
                'academic_official_result_id' => $official?->id, 'target_curriculum_version_id' => $version?->id,
            ])->save();
            $source->update(['enrollment_status' => 'completed']);
            Audit::record($actor->id, 'academic_progression_decided', $source, $decision->reason, [
                'level_id' => $decision->level_id, 'academic_year_id' => $decision->academic_year_id, 'academic_official_result_id' => $decision->academic_official_result_id, 'kind' => $kind, 'snapshot' => $snapshot, 'previous' => $previous,
            ]);
            ProgressionNotice::publish($source, $kind, $official?->reference ?? 'Progression académique');
        }, 3);
    }

    public function start(AcademicProgression $decision, StudentProfile $profile): AcademicEnrollment
    {
        return DB::transaction(function () use ($decision, $profile) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            AcademicYear::whereKey($decision->academic_year_id)->lockForUpdate()->firstOrFail();
            User::lockForUpdate()->findOrFail($profile->user_id);
            $profile = StudentProfile::lockForUpdate()->findOrFail($profile->id);
            $decision = AcademicProgression::lockForUpdate()->findOrFail($decision->id);
            $source = $profile->enrollments()->lockForUpdate()->findOrFail($decision->source_enrollment_id);
            abort_unless($profile->student_status === 'active' && ($this->eligible($source)
                || ($decision->kind === 'resumption' && $source->application?->status?->value === 'validated'
                    && in_array($source->enrollment_status, ['on_leave', 'withdrawn'], true))), 403);
            if ($decision->target_enrollment_id !== null) {
                return $decision->target;
            }
            if (AcademicLifecycle::interrupted($source)) {
                throw ValidationException::withMessages(['progression' => 'Une décision de reprise est requise pour ce parcours interrompu.']);
            }
            $official = app(ResultInputs::class)->latest($source);
            if ($decision->academic_official_result_id !== $official?->id
                || ($source->curriculum_version_id && $decision->kind !== 'resumption' && ! $official)
                || ($decision->decision_snapshot['curriculum_version_id'] ?? $source->curriculum_version_id) !== $source->curriculum_version_id) {
                throw ValidationException::withMessages(['progression' => 'La décision a été révisée. Le service des inscriptions doit confirmer la nouvelle destination.']);
            }
            $due = $decision->decision_snapshot['due_on'] ?? null;
            if ($due && $due < today('Africa/Kinshasa')->toDateString()) {
                throw ValidationException::withMessages(['progression' => 'L’échéance du plan de reprise est dépassée.']);
            }
            $year = AcademicYear::lockForUpdate()->findOrFail($decision->academic_year_id);
            $level = Level::lockForUpdate()->findOrFail($decision->level_id);
            if ($year->status !== 'open' || ! $level->is_active
                || $profile->enrollments()->where('academic_year_id', $year->id)->exists()) {
                throw ValidationException::withMessages(['progression' => 'La réinscription est indisponible pour cette année ou ce niveau.']);
            }
            $program = $source->curriculumVersion?->program;
            if ($program && ! AcademicProgram::openForAdmission()->whereKey($program->id)->exists()) {
                throw ValidationException::withMessages(['progression' => 'Le programme n’est pas ouvert à la réinscription.']);
            }
            $version = null;
            if ($source->curriculum_version_id) {
                $versions = $this->targetVersions($source, $year->id, $level->id)
                    ->when($decision->target_curriculum_version_id, fn ($q, $id) => $q->whereKey($id))->limit(2)->get();
                if ($versions->count() !== 1) {
                    throw ValidationException::withMessages(['progression' => 'Une maquette publiée et compatible doit être déterminée sans ambiguïté.']);
                }
                $version = $versions->first();
            }
            $departmentId = $source->academic_department_id;
            if ($departmentId && ! $level->departmentOptions()->where('is_active', true)->whereKey($departmentId)->exists()) {
                $departmentId = null;
            }
            $target = $profile->enrollments()->create([
                'application_id' => $source->application_id,
                'level_id' => $level->id, 'academic_year_id' => $year->id,
                'academic_department_id' => $departmentId, 'matricule' => $source->matricule ?? $profile->matricule,
                'enrollment_status' => 'pending_confirmation', 'currency' => $source->currency,
            ]);
            $decision->update(['target_enrollment_id' => $target->id, 'target_curriculum_version_id' => $version?->id]);
            Audit::record($profile->user_id, 'academic_renewal_started', $target, data: ['source_enrollment_id' => $source->id]);
            $author = User::findOrFail($decision->decided_by);
            if ($version) {
                $this->curricula->bind($version->id, $target->id, $author, $decision->reason);
            } else {
                $this->curricula->resolveNew($target, $author);
            }
            if (in_array($source->fee_category, ['national', 'foreign'], true)) {
                $this->finance->applyTuitionTariff($target, $profile->user_id, $source->fee_category, [], 'Barème du nouveau niveau appliqué lors de la réinscription.');
            }

            return $target;
        }, 3);
    }

    public function targetVersions(AcademicEnrollment $source, int $yearId, int $levelId)
    {
        return CurriculumVersion::where('academic_program_id', $source->curriculumVersion?->academic_program_id)
            ->where('status', 'published')->whereNotNull('published_at')->where('academic_year_id', $yearId)
            ->where(fn ($q) => $q->whereNull('admission_cohort_id')->orWhere('admission_cohort_id', $source->admission_cohort_id))
            ->whereHas('units', fn ($q) => $q->where('level_id', $levelId));
    }
}
