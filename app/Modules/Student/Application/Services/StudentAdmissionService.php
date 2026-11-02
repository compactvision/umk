<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AdmissionCondition;
use App\Models\Enrollment;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
        $conditions = AdmissionCondition::where('is_required', true)->whereIn('section', ['personal_info', 'academic_info'])->where(fn ($q) => $q->where('level_id', $application->level_id)->orWhere(fn ($f) => $f->whereNull('level_id')->where('faculty_id', $application->level->faculty_id)))->get();
        foreach ($conditions as $condition) {
            if (! $application->documents()->where('key', Str::slug($condition->title, '_'))->where('review_status', 'accepted')->exists()) {
                throw new InvalidEnrollmentStateException('Une pièce obligatoire est manquante : '.$condition->title.'.');
            }
        }
    }

    public function activate(Enrollment $application, ?int $actorId, bool $notify = true): AcademicEnrollment
    {
        return DB::transaction(function () use ($application, $actorId, $notify) {
            $application = Enrollment::lockForUpdate()->findOrFail($application->id);
            if ($actorId !== null) {
                abort_unless(User::findOrFail($actorId)->hasRole('admin'), 403);
            }
            if ($application->status->value !== 'validated') {
                throw new InvalidEnrollmentStateException('Seul un dossier administrativement validé permet l’activation étudiante.');
            }
            $this->ensureComplete($application);
            $user = User::lockForUpdate()->findOrFail($application->student_id);
            $profile = StudentProfile::firstOrCreate(['user_id' => $user->id], ['matricule' => $application->matricule, 'student_status' => 'active']);
            if (! $profile->matricule && $application->matricule) {
                $profile->update(['matricule' => $application->matricule]);
            }
            $existing = AcademicEnrollment::where('student_profile_id', $profile->id)->where('level_id', $application->level_id)->where('academic_year_id', $application->academic_year_id)->first();
            if ($existing && $existing->application_id !== $application->id) {
                throw new InvalidEnrollmentStateException('Une inscription académique existe déjà pour cet étudiant, ce niveau et cette année.');
            }
            $user->assignRole(Role::findOrCreate('student', 'web'));
            if ($existing) {
                return $existing;
            }
            $entry = AcademicEnrollment::create(['student_profile_id' => $profile->id, 'application_id' => $application->id, 'matricule' => $application->matricule, 'level_id' => $application->level_id, 'academic_year_id' => $application->academic_year_id, 'enrollment_status' => 'confirmed', 'currency' => config('student.currency')]);
            Audit::record($actorId, 'student_admission_activated', $entry, null, ['application_id' => $application->id, 'user_id' => $user->id, 'matricule' => $application->matricule]);
            // Keep financial category unassigned until confirmed by authorized staff.
            if ($notify) {
                DB::afterCommit(function () use ($entry, $user, $application) {
                    try {
                        $user->notify(new \App\Notifications\StudentAdmissionActivated(['enrollment_id' => $application->id, 'academic_enrollment_id' => $entry->id, 'reference' => $application->reference, 'matricule' => $entry->matricule]));
                    } catch (\Throwable $exception) {
                        Log::error('Échec de notification d’activation étudiante', ['academic_enrollment_id' => $entry->id, 'error' => $exception->getMessage()]);
                    }
                });
            }

            return $entry;
        });
    }
}
