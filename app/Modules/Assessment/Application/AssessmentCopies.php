<?php

namespace App\Modules\Assessment\Application;

use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicSubmission;
use App\Modules\Teaching\Application\Services\LearningFiles;

final class AssessmentCopies
{
    public function __construct(private LearningFiles $files) {}

    public function snapshot(AcademicSubmission $submission, int $version): array
    {
        $saved = $submission->versions()->where('number', $version)->first();
        if ($saved) {
            return $saved->only(['body', 'path', 'filename', 'received_at', 'late']);
        }
        if ((int) $submission->version === $version) {
            return $submission->only(['body', 'path', 'filename']) + ['received_at' => $submission->updated_at, 'late' => null];
        }
        $previous = AcademicAudit::where('action', 'academic_work_submitted')->where('entity_type', $submission->getTable())
            ->where('entity_id', $submission->id)->where('data->previous->version', $version)->orderBy('id')->first();
        abort_unless($previous, 404);

        return $previous->data['previous'] + ['received_at' => null, 'late' => null];
    }

    public function download(AcademicSubmission $submission, ?int $version = null)
    {
        return $this->files->stream($this->snapshot($submission, $version ?? (int) $submission->version));
    }
}
