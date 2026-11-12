<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\AdmissionCohort;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Enrollment\Domain\Services\EnrollmentValidator;
use App\Notifications\StudentAdmissionActivated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

final class StudentAdmissionService
{
    public function ensureComplete(Enrollment $application): void
    {
        if (! $application->level_id || ! $application->academic_year_id || ! $application->student_id) {
            throw new InvalidEnrollmentStateException('Le niveau, l’année académique et le compte candidat sont requis.');
        }
        if ($application->documents()->where('review_status', '!=', 'accepted')->exists()) {
            throw new InvalidEnrollmentStateException('Toutes les pièces doivent être acceptées.');
        }
        $required = $application->meta['required_documents'] ?? app(EnrollmentValidator::class)->requiredDocuments($application);
        $accepted = $application->documents()->where('review_status', 'accepted')->pluck('key');
        foreach ($required as $key => $label) {
            if (! $accepted->contains($key)) {
                throw new InvalidEnrollmentStateException('Une pièce obligatoire est manquante : '.$label.'.');
            }
        }
    }

    public function activate(Enrollment $application, ?int $actorId, bool $notify = true, bool $historicalImport = false): AcademicEnrollment
    {
        return DB::transaction(function () use ($application, $actorId, $notify, $historicalImport) {
            abort_if($historicalImport && $actorId === null, 403);
            $user = User::lockForUpdate()->findOrFail($application->student_id);
            $application = Enrollment::lockForUpdate()->findOrFail($application->id);
            if ($actorId !== null) {
                $actor = User::findOrFail($actorId);
                abort_unless($actor->hasRole('admin') && $actor->can('manage academic access'), 403);
            }
            if ($application->status->value !== 'validated') {
                throw new InvalidEnrollmentStateException('Seul un dossier administrativement validé permet l’activation étudiante.');
            }
            $this->ensureComplete($application);
            $profile = StudentProfile::firstOrCreate(['user_id' => $user->id], ['matricule' => $application->matricule, 'student_status' => 'active']);
            if (! $profile->matricule && $application->matricule) {
                $profile->update(['matricule' => $application->matricule]);
            }
            $existing = AcademicEnrollment::where('student_profile_id', $profile->id)->where('level_id', $application->level_id)->where('academic_year_id', $application->academic_year_id)->oldest('id')->first();
            if ($existing && $existing->application_id !== $application->id) {
                throw new InvalidEnrollmentStateException('Une inscription académique existe déjà pour cet étudiant, ce niveau et cette année.');
            }
            $user->assignRole(Role::findOrCreate('student', 'web'));
            if ($existing) {
                return $existing;
            }
            $year = \App\Models\AcademicYear::lockForUpdate()->findOrFail($application->academic_year_id);
            if (!$historicalImport && $year->status !== 'open') throw new InvalidEnrollmentStateException('La première inscription nécessite une année ouverte.');
            $level = Level::lockForUpdate()->findOrFail($application->level_id);
            if (!$historicalImport && !$level->is_active) throw new InvalidEnrollmentStateException('Le niveau doit être actif.');
            $choice = $application->form_snapshot['academic_program_id'] ?? null;
            $programIds = $historicalImport ? collect() : $level->programs()->openForAdmission()
                ->when($choice, fn ($query) => $query->whereKey($choice))
                ->limit(2)->pluck('academic_programs.id');
            if (! $historicalImport && $choice && $programIds->isEmpty()) {
                throw new InvalidEnrollmentStateException('Le programme demandé n’est plus disponible pour ce niveau.');
            }

            $programId = $programIds->count() === 1 ? (int) $programIds->first() : null;
            $cohortId = null;
            $promotionId = null;
            if ($programId !== null) {
                $context = ['academic_program_id' => $programId, 'academic_year_id' => $year->id, 'is_active' => true];
                $cohorts = AdmissionCohort::where($context)->limit(2)->pluck('id');
                $cohortId = $cohorts->count() === 1 ? $cohorts->first() : null;
                $promotionId = AcademicPromotion::where($context)->where('level_id', $level->id)->value('id');
            }
            $previousDepartment = $profile->enrollments()
                ->whereHas('level', fn ($q) => $q->where('faculty_id', $level->faculty_id))
                ->whereIn('academic_enrollments.enrollment_status', ['confirmed', 'completed'])
                ->whereNotNull('academic_enrollments.academic_department_id')
                ->whereHas('academicYear', fn ($q) => $q->where('start_date', '<', $application->academicYear->start_date))
                ->join('academic_years', 'academic_years.id', '=', 'academic_enrollments.academic_year_id')
                ->orderByDesc('academic_years.start_date')->orderByDesc('academic_enrollments.id')
                ->value('academic_enrollments.academic_department_id');
            $departmentId = $previousDepartment && $level->departmentOptions()->where('is_active', true)->whereKey($previousDepartment)->exists()
                ? $previousDepartment
                : null;
            $entry = AcademicEnrollment::create(['student_profile_id' => $profile->id, 'application_id' => $application->id, 'matricule' => $profile->matricule ?? $application->matricule, 'level_id' => $application->level_id, 'academic_department_id' => $departmentId, 'admission_cohort_id' => $cohortId, 'academic_promotion_id' => $promotionId, 'academic_year_id' => $application->academic_year_id, 'enrollment_status' => 'pending_confirmation', 'currency' => config('student.currency')]);
            if ($actorId !== null) {
                app(CurriculumService::class)->resolveNew($entry, $actor, $programId);
                $entry->refresh();
            }
            Audit::record($actorId, 'student_admission_activated', $entry, null, ['application_id' => $application->id, 'user_id' => $user->id, 'matricule' => $application->matricule]);
            // Keep financial category unassigned until confirmed by authorized staff.
            if ($notify) {
                DB::afterCommit(function () use ($entry, $user, $application) {
                    try {
                        $user->notify(new StudentAdmissionActivated(['enrollment_id' => $application->id, 'academic_enrollment_id' => $entry->id, 'reference' => $application->reference, 'matricule' => $entry->matricule]));
                    } catch (\Throwable $exception) {
                        Log::error('Échec de notification d’activation étudiante', ['academic_enrollment_id' => $entry->id]);
                    }
                });
            }

            return $entry;
        });
    }
}
