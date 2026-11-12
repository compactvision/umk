<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\EnrollmentChange;
use App\Models\Student\ServiceRequest;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Notifications\AcademicEnrollmentChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class AcademicEnrollmentService
{
    public const TRANSITIONS = [
        'pending_confirmation' => ['under_review', 'correction_required', 'confirmed', 'cancelled'],
        'under_review' => ['correction_required', 'pending_confirmation', 'confirmed', 'cancelled'],
        'correction_required' => ['under_review', 'pending_confirmation', 'cancelled'],
        'confirmed' => ['suspended', 'on_leave', 'withdrawn', 'completed', 'transferred'],
        'suspended' => ['confirmed', 'on_leave', 'withdrawn', 'cancelled'],
        'on_leave' => ['confirmed', 'withdrawn', 'cancelled'],
        'withdrawn' => ['pending_confirmation'],
        'completed' => [], 'cancelled' => [], 'transferred' => [],
    ];

    public function __construct(private StudentFinanceService $finance, private CurriculumService $curricula) {}

    public static function contextToken(AcademicEnrollment $entry): string
    {
        return hash('sha256', json_encode($entry->only(['id', 'enrollment_status', 'class_id', 'academic_department_id', 'curriculum_version_id', 'updated_at']), JSON_THROW_ON_ERROR));
    }

    private function assertContext(AcademicEnrollment $entry, array $data): void
    {
        if (isset($data['expected_context']) && ! hash_equals(self::contextToken($entry), $data['expected_context'])) {
            $this->fail('expected_context', 'Les affectations ou le dossier ont changé. Actualisez avant de décider.');
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }

    public function transition(AcademicEnrollment $entry, User $actor, array $data): AcademicEnrollment
    {
        Gate::forUser($actor)->authorize('manage', $entry);

        return DB::transaction(function () use ($entry, $actor, $data) {
            // One lock order for all administrative changes: year, profile, enrollment, group.
            $year = AcademicYear::lockForUpdate()->findOrFail($entry->academic_year_id);
            StudentProfile::lockForUpdate()->findOrFail($entry->student_profile_id);
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            if ($replay = $entry->changes()->where('operation_key', $data['operation_key'])->first()) {
                if ($replay->request_hash !== $this->fingerprint($data) || $replay->action !== 'transition' || ($replay->after['enrollment_status'] ?? null) !== $data['enrollment_status']) {
                    $this->fail('operation_key', 'Cette référence désigne une autre opération.');
                }

                return $entry;
            }
            $this->assertContext($entry, $data);
            if (isset($data['expected_status']) && $data['expected_status'] !== $entry->enrollment_status) {
                $this->fail('enrollment_status', 'Le dossier a changé. Actualisez la situation avant de décider.');
            }
            if ($year->status !== 'open') {
                $this->fail('enrollment_status', 'L’année doit être ouverte pour modifier une inscription.');
            }
            if (in_array($entry->enrollment_status, ['completed', 'cancelled', 'transferred'], true)) {
                $this->fail('enrollment_status', 'Ce contexte historique est terminal et ne peut plus être modifié.');
            }
            $before = $entry->only(['enrollment_status', 'class_id', 'academic_department_id']) + ['student_status' => $entry->profile->student_status];
            $next = $data['enrollment_status'];
            if (($data['student_status'] ?? null) === 'graduated' && $entry->profile->student_status !== 'graduated') {
                $this->fail('student_status', 'La diplomation exige une validation officielle de fin de cursus.');
            }
            if ($next !== $entry->enrollment_status && ! in_array($next, self::TRANSITIONS[$entry->enrollment_status] ?? [], true)) {
                $this->fail('enrollment_status', 'Cette transition administrative est interdite.');
            }
            if ($next === 'transferred') {
                $this->fail('enrollment_status', 'Utilisez la décision de transfert pour conserver le contexte précédent.');
            }
            if ($next === 'confirmed' && $next !== $entry->enrollment_status) {
                if ($entry->application?->status?->value !== 'validated' || $entry->profile->student_status !== 'active') {
                    $this->fail('enrollment_status', 'Une admission validée et un dossier actif sont requis.');
                }
                if (config('student.enrollment_requires_first_installment') && ! $this->finance->firstTuitionInstallmentCovered($entry)) {
                    $this->fail('enrollment_status', 'La première tranche doit être couverte selon le module Finance.');
                }
            }
            if (array_key_exists('academic_department_id', $data)) {
                $departmentId = $data['academic_department_id'];
                if ($departmentId !== null && ! $entry->level->departmentOptions()->where('is_active', true)->whereKey($departmentId)->exists()) {
                    $this->fail('academic_department_id', 'Ce département n’est pas autorisé pour le niveau.');
                }
                $entry->academic_department_id = $departmentId;
            }
            if (array_key_exists('class_id', $data)) {
                $this->assignGroup($entry, $data['class_id']);
            }
            $entry->enrollment_status = $next;
            $entry->save();
            if (array_key_exists('student_status', $data)) {
                $entry->profile->update(['student_status' => $data['student_status']]);
            }
            if ($entry->wasChanged(['class_id', 'academic_department_id'])) {
                app(\App\Modules\Teaching\Application\Services\CourseRegistrationService::class)->closeOutsideAudience($entry, $actor);
            }
            $this->record($entry, $actor, 'transition', $before, $data);

            return $entry;
        }, 3);
    }

    /** Called by the lifecycle workflow after validation of the certified completion. */
    public function completeGraduation(AcademicEnrollment $entry, User $actor, string $reason): void
    {
        Gate::forUser($actor)->authorize('view', $entry);
        abort_unless($actor->can(\App\Modules\Progression\Application\AcademicLifecycle::GRADUATE), 403);
        $entry->update(['enrollment_status' => 'completed']);
        $ongoing = $entry->profile->enrollments()->whereKeyNot($entry->id)
            ->whereIn('enrollment_status', ['confirmed', 'pending_confirmation', 'on_leave', 'suspended'])->exists();
        if (! $ongoing && $entry->profile->student_status === 'active') {
            $entry->profile->update(['student_status' => 'graduated']);
        }
        Audit::record($actor->id, 'academic_enrollment_graduation_confirmed', $entry, $reason,
            ['student_status' => $entry->profile->student_status]);
    }

    private function assignGroup(AcademicEnrollment $entry, ?int $id): void
    {
        if ($id === null) {
            $entry->class_id = null;

            return;
        }
        $group = Classes::lockForUpdate()->findOrFail($id);
        $promotion = $group->promotion;
        $programId = $entry->promotion?->academic_program_id ?? $entry->admissionCohort?->academic_program_id ?? $entry->curriculumVersion?->academic_program_id;
        if ($group->status !== 'OPEN') {
            $this->fail('class_id', 'Ce groupe est fermé.');
        }
        if ((int) $group->level_id !== (int) $entry->level_id || (int) $group->faculty_id !== (int) $entry->level->faculty_id
            || ($promotion && (! $promotion->is_active || (int) $promotion->academic_year_id !== (int) $entry->academic_year_id
                || ($programId !== null && (int) $promotion->academic_program_id !== (int) $programId)))) {
            $this->fail('class_id', 'Le groupe et sa promotion ne correspondent pas au contexte annuel.');
        }
        $occupied = AcademicEnrollment::where('class_id', $id)->where('academic_year_id', $entry->academic_year_id)
            ->whereNotIn('enrollment_status', ['cancelled', 'withdrawn', 'transferred'])->whereKeyNot($entry->id)->count();
        if ($group->capacity !== null && $occupied >= $group->capacity) {
            $this->fail('class_id', 'La capacité du groupe est atteinte.');
        }
        $entry->class_id = $id;
    }

    public function transfer(AcademicEnrollment $entry, User $actor, array $data): AcademicEnrollment
    {
        Gate::forUser($actor)->authorize('manage', $entry);
        abort_unless($actor->can('publish academic content'), 403);

        return DB::transaction(function () use ($entry, $actor, $data) {
            $year = AcademicYear::lockForUpdate()->findOrFail($entry->academic_year_id);
            $profile = StudentProfile::lockForUpdate()->findOrFail($entry->student_profile_id);
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            $replay = $entry->changes()->where('operation_key', $data['operation_key'])->first();
            if ($replay) {
                if ($replay->request_hash !== $this->fingerprint($data) || $replay->action !== 'transfer' || (int) ($replay->after['level_id'] ?? 0) !== (int) $data['level_id']) {
                    $this->fail('operation_key', 'Référence déjà utilisée.');
                }

                return $replay->target;
            }
            $this->assertContext($entry, $data);
            if (isset($data['expected_status']) && $data['expected_status'] !== $entry->enrollment_status) {
                $this->fail('level_id', 'Le dossier a changé. Actualisez-le avant le transfert.');
            }
            if ($year->status !== 'open' || ! in_array($entry->enrollment_status, ['confirmed', 'suspended', 'on_leave'], true)) {
                $this->fail('level_id', 'Cette inscription ne peut pas être transférée.');
            }
            $level = Level::where('is_active', true)->findOrFail($data['level_id']);
            if ($actor->academicFaculties()->exists() && ! $actor->academicFaculties()->whereKey($level->faculty_id)->exists()) {
                abort(403);
            }
            if ($profile->enrollments()->where('level_id', $level->id)->where('academic_year_id', $entry->academic_year_id)
                ->whereNotNull('context_slot')->whereKeyNot($entry->id)->exists()) {
                $this->fail('level_id', 'Un contexte réservé existe déjà pour ce niveau et cette année.');
            }
            $version = CurriculumVersion::where('status', 'published')
                ->whereHas('program', fn ($q) => $q->openForAdmission()->where('faculty_id', $level->faculty_id)
                    ->whereHas('levels', fn ($l) => $l->where('levels.id', $level->id)))
                ->findOrFail($data['curriculum_version_id']);
            if ($entry->curriculumVersion && $version->program->academic_cycle_id !== $entry->curriculumVersion->program->academic_cycle_id) {
                $this->fail('curriculum_version_id', 'Un changement de cycle nécessite une admission distincte.');
            }
            if ($level->faculty->university_id !== $entry->level->faculty->university_id) {
                $this->fail('level_id', 'Les transferts entre établissements doivent passer par un dossier distinct.');
            }
            if ((int) $entry->level_id === (int) $level->id && (int) $entry->curriculumVersion?->academic_program_id === (int) $version->academic_program_id) {
                $this->fail('curriculum_version_id', 'Un changement de groupe ou de département utilise une transition ; le programme reste identique.');
            }
            $before = $entry->only(['enrollment_status', 'level_id', 'curriculum_version_id', 'class_id', 'academic_department_id']);
            $entry->forceFill(['context_slot' => null, 'enrollment_status' => 'transferred'])->save();
            $target = $profile->enrollments()->create([
                'application_id' => $entry->application_id, 'matricule' => $profile->matricule ?? $entry->matricule,
                'level_id' => $level->id, 'academic_year_id' => $entry->academic_year_id,
                'enrollment_status' => 'pending_confirmation', 'currency' => $entry->currency,
            ]);
            $this->curricula->bind($version->id, $target->id, $actor, $data['reason']);
            $target->refresh();
            if (array_key_exists('class_id', $data)) {
                $this->assignGroup($target, $data['class_id']);
                $target->save();
            }
            $this->record($entry, $actor, 'transfer', $before, $data, $target);

            return $target;
        }, 3);
    }

    private function fingerprint(array $data): string
    {
        unset($data['operation_key']);
        ksort($data);

        return hash('sha256', json_encode($data, JSON_THROW_ON_ERROR));
    }

    private function record(AcademicEnrollment $entry, User $actor, string $action, array $before, array $data, ?AcademicEnrollment $target = null): void
    {
        $after = ($target ?? $entry)->only(['enrollment_status', 'level_id', 'curriculum_version_id', 'class_id', 'academic_department_id']) + ['student_status' => $entry->profile->student_status];
        if (! empty($data['service_request_id'])) {
            $ticket = ServiceRequest::where('academic_enrollment_id', $entry->id)->lockForUpdate()->findOrFail($data['service_request_id']);
            if ($ticket->status !== 'open') {
                $this->fail('service_request_id', 'Cette demande est déjà résolue.');
            }
            app(StudentRequestService::class)->respond($ticket, $actor, ['status' => 'resolved', 'response' => $data['student_response']]);
            $after['service_request_id'] = $ticket->id;
        }
        $change = EnrollmentChange::create([
            'academic_enrollment_id' => $entry->id, 'target_enrollment_id' => $target?->id, 'actor_id' => $actor->id,
            'operation_key' => $data['operation_key'], 'request_hash' => $this->fingerprint($data), 'action' => $action, 'before' => $before, 'after' => $after,
            'reason' => $data['reason'], 'effective_at' => now(), 'ends_at' => $data['ends_at'] ?? null, 'created_at' => now(),
        ]);
        Audit::record($actor->id, 'academic_enrollment_'.$action, $entry, $data['reason'], ['change_id' => $change->id, 'before' => $before, 'after' => $after]);
        $entry->profile->user->notify(new AcademicEnrollmentChanged([
            'academic_enrollment_id' => ($target ?? $entry)->id, 'action' => $action, 'status' => ($target ?? $entry)->enrollment_status,
            'change_id' => $change->id,
        ]));
    }
}
