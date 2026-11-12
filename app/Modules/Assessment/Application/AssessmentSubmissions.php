<?php

namespace App\Modules\Assessment\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final class AssessmentSubmissions
{
    public function __construct(private AssessmentAccess $access, private LearningFiles $files) {}

    public function submit(AcademicEnrollment $entry, AcademicResource $resource, array $input, ?UploadedFile $file, int $actor): void
    {
        $facts = $file ? $this->files->inspect($file, 'material') : [];
        $fingerprint = hash('sha256', json_encode([$input['body'] ?? null, $facts], JSON_THROW_ON_ERROR));
        $written = null;
        try {
            DB::transaction(function () use ($entry, $resource, $input, $file, $actor, $facts, $fingerprint, &$written) {
                $offer = AcademicOffering::sharedLock()->findOrFail($resource->academic_offering_id);
                abort_if($offer->archived_at, 403, 'Les dépôts sont clôturés pour cette offre.');
                $resource = $offer->resources()->visible()->forStudent($entry)->sharedLock()->findOrFail($resource->id);
                $assessment = $resource->assessment()->sharedLock()->first();
                $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
                abort_unless($this->access->eligible($entry, $resource), 403, 'Votre dossier ne permet pas ce dépôt.');
                $participant = $assessment?->records()->where('academic_enrollment_id', $entry->id)->with('group')->first();
                if ($assessment?->group_work) {
                    abort_unless($participant?->group && $participant->group->leader_enrollment_id === $entry->id, 403, 'Le membre désigné transmet le travail collectif.');
                }

                $submission = AcademicSubmission::firstOrNew(['academic_enrollment_id' => $entry->id, 'academic_resource_id' => $resource->id]);
                if ($submission->exists && isset($input['operation_key'])) {
                    $previous = $submission->versions()->where('operation_key', $input['operation_key'])->first();
                    if ($previous) {
                        AssessmentRules::require($previous->operation_hash === $fingerprint, 'operation_key', 'Cet envoi a déjà été utilisé pour un autre contenu.');

                        return;
                    }
                }

                $now = now();
                $late = $resource->closes_at && $now->gt($resource->closes_at);
                $limit = $assessment?->accepts_until ?? $resource->closes_at;
                abort_if(($resource->opens_at && $now->lt($resource->opens_at)) || ($limit && $now->gt($limit)), 403, 'La période de dépôt n’est pas ouverte.');
                if ($assessment) {
                    abort_unless($assessment->state === 'published' && $assessment->modality !== 'in_person', 403, 'Les remises sont fermées.');
                    abort_if($participant && in_array($participant->participation, ['exempt', 'invalidated'], true), 403);
                    AssessmentRules::require(! $submission->exists || $submission->version < $assessment->attempt_limit, 'file', 'Le nombre de dépôts autorisés est atteint.');
                    AssessmentRules::require(isset($input['operation_key'], $input['expected_version']), 'operation_key', 'Rechargez le formulaire avant le dépôt.');
                }
                if (isset($input['expected_version'])) {
                    AssessmentRules::revision($submission->exists ? (int) $submission->version : 0, $input['expected_version']);
                }

                $previousVersion = $submission->exists ? $submission->versions()->where('number', $submission->version)->first() : null;
                if ($submission->exists && ! $previousVersion) {
                    $previousVersion = $submission->versions()->create($submission->only(['body', 'path', 'filename']) + [
                        'number' => $submission->version, 'received_at' => $submission->updated_at,
                    ]);
                }
                if ($file) {
                    $stored = $this->files->store($file, $facts, $written, 'student-work/'.$entry->id);
                    $submission->fill(['path' => $stored['path'], 'filename' => $stored['filename']]);
                }
                $submission->fill(['body' => $input['body'] ?? null, 'version' => $submission->exists ? $submission->version + 1 : 1])->save();
                $submission->versions()->create($submission->only(['body', 'path', 'filename']) + [
                    'number' => $submission->version, 'received_at' => $now, 'late' => $late,
                    'operation_key' => $input['operation_key'] ?? null, 'operation_hash' => $fingerprint,
                    'sha256' => $facts['sha256'] ?? $previousVersion?->sha256,
                ]);
                if ($assessment) {
                    $participant ??= $assessment->records()->create(['academic_enrollment_id' => $entry->id,
                        'academic_course_registration_id' => $this->access->registration($entry, $resource)]);
                    $status = $late ? 'late_submission' : 'submitted';
                    if ($participant->group) {
                        $participant->group->records()->whereIn('participation', ['unassessed', 'not_submitted', 'submitted', 'late_submission'])
                            ->update(['participation' => $status]);
                    } else {
                        $participant->update(['participation' => $status]);
                    }
                }
                Audit::record($actor, 'academic_work_submitted', $submission, null, ['version' => $submission->version, 'late' => $late]);
                if ($assessment) {
                    AssessmentNotices::send($entry, $resource, 'received', $submission->id.'-'.$submission->version);
                }
            });
        } catch (\Throwable $error) {
            if ($written !== null) {
                Storage::disk('local')->delete($written);
            }
            throw $error;
        }
    }
}
