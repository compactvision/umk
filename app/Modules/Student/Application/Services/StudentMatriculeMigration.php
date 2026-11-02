<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Enrollment;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentProfile;
use App\Modules\Enrollment\Domain\Services\MatriculeGenerator;
use App\Notifications\StudentAdmissionActivated;
use Illuminate\Support\Facades\DB;

final class StudentMatriculeMigration
{
    public function __construct(private MatriculeGenerator $generator) {}

    public function run(bool $dryRun = false): array
    {
        DB::beginTransaction();
        try {
            $changes = [];
            foreach (Enrollment::with(['level.faculty', 'academicYear'])->whereNotNull('matricule')->orderBy('created_at')->orderBy('id')->lockForUpdate()->get() as $application) {
                $old = $application->matricule;
                $code = $application->level?->faculty?->code;
                if (! $code || ! $application->academicYear) {
                    throw new \RuntimeException('Contexte académique incomplet : '.$application->reference);
                }
                $matches = [];
                $alreadyFormatted = preg_match('/^'.preg_quote($code, '/').'(\d{4,8})$/', $old, $matches) && (int) $matches[1] > 0;
                $new = $alreadyFormatted ? $old : $this->generator->generate($application->level, $application->academicYear)->toString();
                $profile = StudentProfile::where('user_id', $application->student_id)->lockForUpdate()->first();
                $entries = AcademicEnrollment::where('application_id', $application->id)->lockForUpdate()->get();
                $needsProfile = $profile && ($profile->matricule === $old || ! $profile->matricule) && $profile->matricule !== $new;
                $needsAcademic = $entries->contains(fn ($entry) => $entry->matricule !== $new);
                if ($old !== $new || $needsProfile || $needsAcademic) {
                    $application->update(['matricule' => $new]);
                    if ($needsProfile) {
                        $profile->update(['matricule' => $new]);
                    }
                    foreach ($entries as $entry) {
                        $entry->update(['matricule' => $new]);
                    }
                    Audit::record(null, 'student_matricule_migrated', $application, 'Adoption du format code faculté et numéro d’entrée.', ['previous' => $old, 'matricule' => $new, 'student_id' => $application->student_id]);
                    $changes[] = ['reference' => $application->reference, 'previous' => $old, 'matricule' => $new];
                }
                // Persistent welcome notifications must resolve to the same current identifier.
                foreach (DB::table('notifications')->where('notifiable_type', \App\Models\User::class)->where('notifiable_id', $application->student_id)->where('type', StudentAdmissionActivated::class)->get(['id', 'data']) as $notification) {
                    $data = json_decode($notification->data, true, 512, JSON_THROW_ON_ERROR);
                    if ((int) ($data['enrollment_id'] ?? 0) === $application->id && ($data['matricule'] ?? null) !== $new) {
                        $data['matricule'] = $new;
                        DB::table('notifications')->where('id', $notification->id)->update(['data' => json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)]);
                    }
                }
            }
            $dryRun ? DB::rollBack() : DB::commit();

            return $changes;
        } catch (\Throwable $exception) {
            DB::rollBack();
            throw $exception;
        }
    }
}
