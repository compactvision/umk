<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\CourseRegistration;
use App\Models\User;
use App\Modules\Results\Application\OfficialAcquisitions;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CourseRegistrationService
{
    public function __construct(private CourseAudience $audience) {}

    public function register(AcademicOffering $offering, AcademicEnrollment $entry, User $actor, string $mode, string $reason, bool $plannedRetake = false): CourseRegistration
    {
        TeachingScope::authorize($actor, (int) $offering->level->faculty_id, 'manage academic access');
        TeachingScope::authorize($actor, (int) $entry->level->faculty_id, 'manage academic access');

        return DB::transaction(function () use ($offering, $entry, $actor, $mode, $reason, $plannedRetake) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::lockForUpdate()->findOrFail($offering->id);
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            $candidates = $plannedRetake ? $this->audience->plannedRetakeCandidates($offering) : $this->audience->candidates($offering);
            if (! $offering->curriculum_item_id || ! $offering->is_published || $offering->archived_at || $offering->academicYear->status !== 'open'
                || ! $candidates->whereKey($entry->id)->exists()) {
                throw ValidationException::withMessages(['academic_enrollment_id' => 'L’inscription annuelle active doit correspondre à l’offre publiée, à son groupe et à sa maquette.']);
            }
            if (! in_array($mode, ['mandatory', 'elective', 'repeat', 'derogation'], true)
                || ($mode === 'mandatory' && $offering->is_optional) || ($mode === 'elective' && ! $offering->is_optional)) {
                throw ValidationException::withMessages(['mode' => 'Le type d’inscription ne correspond pas à cette matière.']);
            }
            $key = $offering->id.':'.$entry->id;
            if ($existing = $offering->registrations()->where('active_key', $key)->first()) {
                if ($existing->mode !== $mode && $mode !== 'mandatory') {
                    throw ValidationException::withMessages(['mode' => 'Une inscription active existe déjà avec un autre motif.']);
                }

                return $existing;
            }
            if (! $this->prerequisiteMet($offering, $entry, $mode)) {
                throw ValidationException::withMessages(['academic_enrollment_id' => 'Le prérequis officiel n’est pas validé. Une dérogation motivée est nécessaire.']);
            }

            return $this->append($offering, $entry, $actor, $mode, $reason);
        }, 3);
    }

    public function sync(AcademicOffering $offering, User $actor, string $reason): array
    {
        TeachingScope::authorize($actor, (int) $offering->level->faculty_id, 'manage academic access');

        return DB::transaction(function () use ($offering, $actor, $reason) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::lockForUpdate()->findOrFail($offering->id);
            if (! $offering->curriculum_item_id || ! $offering->is_published || $offering->is_optional || $offering->archived_at || $offering->academicYear->status !== 'open') {
                throw ValidationException::withMessages(['offering' => 'Synchronisez une offre obligatoire publiée dans une année ouverte.']);
            }
            AcademicYear::lockForUpdate()->findOrFail($offering->academic_year_id);
            $candidates = $this->audience->candidates($offering);
            $summary = ['registered' => 0, 'skipped_prerequisite' => 0, 'withdrawn' => 0];
            $offering->registrations()->whereNull('withdrawn_at')->where('mode', 'mandatory')
                ->whereNotIn('academic_enrollment_id', (clone $candidates)->select('academic_enrollments.id'))->chunkById(200, function ($rows) use ($actor, $reason, &$summary) {
                    foreach ($rows as $row) {
                        $this->end($row, $actor, $reason, 'context');
                        $summary['withdrawn']++;
                    }
                });
            $candidates->whereDoesntHave('courseRegistrations', fn ($q) => $q->where('academic_offering_id', $offering->id)->where(fn ($r) => $r->whereNull('withdrawn_at')->orWhere('withdrawal_kind', 'manual')))
                ->chunkById(200, function ($entries) use ($offering, $actor, $reason, &$summary) {
                    $official = $offering->required_unit_id
                        ? app(OfficialAcquisitions::class)->profiles($offering->required_unit_id, $entries->pluck('student_profile_id'))->flip()
                        : null;
                    foreach ($entries as $entry) {
                        if ($official !== null && ! $official->has($entry->student_profile_id)) {
                            $summary['skipped_prerequisite']++;

                            continue;
                        }
                        $this->append($offering, $entry, $actor, 'mandatory', $reason);
                        $summary['registered']++;
                    }
                });
            Audit::record($actor->id, 'course_registration_sync', $offering, $reason, $summary);

            return $summary;
        }, 3);
    }

    public function withdraw(CourseRegistration $registration, User $actor, string $reason): void
    {
        TeachingScope::authorize($actor, (int) $registration->offering->level->faculty_id, 'manage academic access');
        DB::transaction(function () use ($registration, $actor, $reason) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            AcademicOffering::lockForUpdate()->findOrFail($registration->academic_offering_id);
            $row = CourseRegistration::lockForUpdate()->findOrFail($registration->id);
            if ($row->offering->archived_at || $row->offering->academicYear->status !== 'open') {
                throw ValidationException::withMessages(['registration' => 'Cet historique ne peut plus être modifié.']);
            }
            $this->end($row, $actor, $reason);
        }, 3);
    }

    /** Called within the annual enrollment's audited group/department change. */
    public function closeOutsideAudience(AcademicEnrollment $entry, User $actor): void
    {
        $entry->courseRegistrations()->whereNull('withdrawn_at')->whereHas('offering', fn ($q) => $q
            ->where(fn ($audience) => $audience
                ->where(fn ($group) => $group->whereNotNull('class_id')->where('class_id', '!=', $entry->class_id ?? -1))
                ->orWhere(fn ($department) => $department->whereNotNull('academic_department_id')->where('academic_department_id', '!=', $entry->academic_department_id ?? -1))))
            ->lockForUpdate()->chunkById(100, function ($rows) use ($actor) {
                foreach ($rows as $row) {
                    $this->end($row, $actor, 'Changement de groupe ou de département dans l’inscription annuelle.', 'context');
                }
            });
    }

    private function end(CourseRegistration $row, User $actor, string $reason, string $kind = 'manual'): void
    {
        if ($row->withdrawn_at) {
            return;
        }
        $row->update(['withdrawn_at' => now(), 'withdrawal_kind' => $kind, 'active_key' => null]);
        Audit::record($actor->id, 'course_registration_withdrawn', $row, $reason);
    }

    private function append(AcademicOffering $offering, AcademicEnrollment $entry, User $actor, string $mode, string $reason): CourseRegistration
    {
        $row = $offering->registrations()->create([
            'academic_enrollment_id' => $entry->id, 'mode' => $mode, 'registered_at' => now(),
            'registered_by' => $actor->id, 'active_key' => $offering->id.':'.$entry->id,
        ]);
        Audit::record($actor->id, 'course_registration_created', $row, $reason, ['mode' => $mode]);

        return $row;
    }

    private function prerequisiteMet(AcademicOffering $offering, AcademicEnrollment $entry, string $mode): bool
    {
        return ! $offering->required_unit_id || $mode === 'derogation'
            || app(OfficialAcquisitions::class)->profiles($offering->required_unit_id, collect([$entry->student_profile_id]))->isNotEmpty();
    }
}
