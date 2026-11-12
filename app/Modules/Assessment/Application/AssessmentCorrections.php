<?php

namespace App\Modules\Assessment\Application;

use App\Models\Student\AcademicAssessment;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\AssessmentRecord;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class AssessmentCorrections
{
    public function __construct(private AssessmentWorkflow $workflow, private AssessmentAccess $access, private LearningFiles $files) {}

    public function save(AcademicResource $resource, User $actor, AssessmentRecord $record, array $input, ?UploadedFile $file): void
    {
        $facts = $file ? $this->files->inspect($file, 'material') : [];
        $written = null;
        try {
            $this->workflow->locked($resource, $actor, function (AcademicAssessment $assessment) use ($record, $actor, $input, $file, $facts, &$written) {
                $this->closed($assessment);
                $record = $assessment->records()->with('group')->findOrFail($record->id);
                AssessmentRules::revision($record->revision, $input['revision']);
                AssessmentRules::require($record->correction_state === 'draft', 'state', 'La correction est verrouillée.');
                $participation = $input['participation'];
                $score = AssessmentRules::points($input['points'] ?? null, 'points');
                $adjustment = AssessmentRules::points($input['adjustment'] ?? null, 'adjustment', signed: true);
                $criteria = [];
                $scored = in_array($participation, AssessmentRecord::SCORED, true);
                if ($scored && $assessment->rubric && isset($input['criteria'])) {
                    AssessmentRules::require(count($input['criteria']) === count($assessment->rubric), 'criteria', 'Renseignez chaque critère.');
                    foreach ($assessment->rubric as $index => $criterion) {
                        $value = AssessmentRules::points($input['criteria'][$index] ?? null, 'criteria');
                        AssessmentRules::require($value !== null && $value <= $criterion['maximum'], 'criteria', 'Un critère dépasse son maximum.');
                        $criteria[] = $value;
                    }
                    $score = array_sum($criteria);
                }
                if ($adjustment !== null) {
                    AssessmentRules::require($record->group?->shared_points !== null && $criteria === [] && $score === null,
                        'adjustment', 'L’ajustement utilise uniquement la note collective.');
                    $score = $record->group->shared_points + $adjustment;
                }
                $this->checkScore($assessment, $score, $scored);
                $fields = [
                    'participation' => $participation, 'points' => $score, 'criterion_points' => $criteria,
                    'adjustment' => $adjustment, 'feedback' => $input['feedback'] ?? null, 'corrected_by' => $actor->id,
                    'revision' => $record->revision + 1,
                ];
                if ($file) {
                    $stored = $this->files->store($file, $facts, $written, 'assessment-feedback/'.$assessment->id);
                    $fields += ['feedback_path' => $stored['path'], 'feedback_filename' => $stored['filename']];
                }
                $record->update($fields);
                $this->history($record);
                Audit::record($actor->id, 'assessment_correction_saved', $record, $input['reason'], ['revision' => $record->revision]);
            });
        } catch (\Throwable $error) {
            if ($written !== null) {
                Storage::disk('local')->delete($written);
            }
            throw $error;
        }
    }

    public function groupScore(AcademicResource $resource, User $actor, int $group, array $input): void
    {
        $this->workflow->locked($resource, $actor, function (AcademicAssessment $assessment) use ($actor, $group, $input) {
            $this->closed($assessment);
            $group = $assessment->groups()->findOrFail($group);
            AssessmentRules::revision($group->revision, $input['revision']);
            AssessmentRules::require(! $group->records()->where(fn ($query) => $query->where('correction_state', '!=', 'draft')
                ->orWhereNotNull('adjustment'))->exists(), 'group', 'La note collective est figée dès son utilisation dans une correction.');
            $score = AssessmentRules::points($input['points'] ?? null, 'points');
            $this->checkScore($assessment, $score, true);
            $group->update(['shared_points' => $score, 'feedback' => $input['feedback'] ?? null, 'revision' => $group->revision + 1]);
            Audit::record($actor->id, 'assessment_group_corrected', $group, $input['reason'], ['revision' => $group->revision]);
        });
    }

    public function record(AcademicResource $resource, User $actor, AssessmentRecord $record, array $input): void
    {
        $this->workflow->locked($resource, $actor, function (AcademicAssessment $assessment, AcademicResource $resource) use ($actor, $record, $input) {
            $this->closed($assessment);
            $record = $assessment->records()->findOrFail($record->id);
            AssessmentRules::revision($record->revision, $input['revision']);
            if ($input['action'] === 'finalize') {
                AssessmentRules::require($record->correction_state === 'draft' && $record->participation !== 'unassessed', 'state', 'Renseignez la participation avant de finaliser.');
                $scored = in_array($record->participation, AssessmentRecord::SCORED, true);
                AssessmentRules::require(! ($assessment->maximum_points !== null && $scored) || $record->points !== null, 'points', 'Une note est nécessaire pour cette participation.');
                AssessmentRules::require(! ($assessment->rubric && $scored) || count($record->criterion_points ?? []) === count($assessment->rubric)
                    || $record->adjustment !== null, 'criteria', 'Renseignez la grille ou utilisez la note collective.');
                $record->correction_state = 'finalized';
            } else {
                $this->access->validate($actor, $resource->offering);
                AssessmentRules::require(in_array($record->correction_state, ['finalized', 'validated'], true), 'state', 'Seule une correction finalisée peut être rouverte.');
                $record->fill(['correction_state' => 'draft', 'released_at' => null]);
            }
            $record->revision++;
            $record->save();
            $this->history($record);
            Audit::record($actor->id, 'assessment_correction_'.$input['action'], $record, $input['reason'], ['revision' => $record->revision]);
        }, serializeTransmission: $input['action'] === 'reopen');
    }

    public function batch(AcademicResource $resource, User $actor, array $input): void
    {
        $this->workflow->locked($resource, $actor, function (AcademicAssessment $assessment, AcademicResource $resource) use ($actor, $input) {
            $this->closed($assessment);
            AssessmentRules::revision($assessment->revision, $input['revision']);
            $action = $input['action'];
            if ($action === 'validate') {
                $this->access->validate($actor, $resource->offering);
                AssessmentRules::require($assessment->records()->exists() && ! $assessment->records()->where('correction_state', 'draft')->exists(),
                    'state', 'Chaque participant doit avoir une correction finalisée ou une situation explicite.');
                $pending = $assessment->records()->where('correction_state', 'finalized');
            } else {
                $states = $assessment->feedback_policy === 'finalized' ? ['finalized', 'validated'] : ['validated'];
                $pending = $assessment->records()->whereIn('correction_state', $states)->whereNull('released_at');
            }
            $changes = 0;
            $pending->with(['enrollment.profile.user', 'enrollment.application', 'enrollment.academicYear', 'group'])->eachById(function ($record) use ($assessment, $resource, $action, $actor, $input, &$changes) {
                if ($action === 'validate') {
                    $record->correction_state = 'validated';
                    $record->revision++;
                    $record->save();
                    $this->history($record);
                    $record->handoffs()->create(['revision' => $record->revision, 'payload' => $this->payload($assessment, $resource, $record, $actor)]);
                } else {
                    $record->update(['released_at' => now()]);
                    if (($input['notify'] ?? false) && $this->access->canReadFeedback($record->enrollment, $assessment)) {
                        AssessmentNotices::send($record->enrollment, $resource, 'feedback', $record->id.'-'.$record->revision);
                    }
                }
                $changes++;
            }, 100);
            if ($changes > 0) {
                $assessment->increment('revision');
                Audit::record($actor->id, 'assessment_'.$action, $assessment, $input['reason'], ['records' => $changes]);
            }
        }, serializeTransmission: $input['action'] === 'validate');
    }

    private function history(AssessmentRecord $record): void
    {
        $record->history()->create(['revision' => $record->revision, 'snapshot' => $record->only([
            'participation', 'correction_state', 'points', 'adjustment', 'criterion_points', 'feedback', 'corrected_by', 'feedback_path', 'feedback_filename',
        ])]);
    }

    private function closed(AcademicAssessment $assessment): void
    {
        AssessmentRules::require($assessment->state === 'closed', 'state', 'Clôturez l’évaluation avant de corriger.');
    }

    private function checkScore(AcademicAssessment $assessment, ?int $points, bool $scored): void
    {
        AssessmentRules::require($points === null || ($scored && $assessment->maximum_points !== null && $points >= 0 && $points <= $assessment->maximum_points),
            'points', 'La note doit respecter le barème et la situation de participation.');
    }

    private function payload(AcademicAssessment $assessment, AcademicResource $resource, AssessmentRecord $record, User $validator): array
    {
        $offer = $resource->offering;
        $attempt = AcademicSubmission::where('academic_resource_id', $resource->id)
            ->where('academic_enrollment_id', $record->group?->leader_enrollment_id ?? $record->academic_enrollment_id)
            ->first(['id', 'version']);
        $now = now()->toISOString();

        return [
            'schema_version' => 1, 'result_key' => 'assessment-record:'.$record->id, 'revision' => $record->revision,
            'student_profile_id' => $record->enrollment->student_profile_id, 'academic_enrollment_id' => $record->academic_enrollment_id,
            'academic_course_registration_id' => $record->academic_course_registration_id, 'academic_assessment_id' => $assessment->id,
            'academic_resource_id' => $resource->id, 'academic_offering_id' => $offer->id, 'course_id' => $offer->course_id,
            'curriculum_item_id' => $offer->curriculum_item_id, 'curriculum_unit_id' => $offer->curriculumItem?->curriculum_unit_id,
            'curriculum_version_id' => $offer->curriculumItem?->curriculum_version_id, 'academic_year_id' => $offer->academic_year_id,
            'academic_semester_id' => $offer->academic_semester_id, 'academic_session_id' => $resource->academic_session_id,
            'session_code' => $assessment->session_code, 'category' => $assessment->category, 'participation' => $record->participation,
            'correction_state' => 'validated', 'points_hundredths' => $record->points, 'maximum_points_hundredths' => $assessment->maximum_points,
            'weight_percent' => $assessment->weight, 'group_id' => $record->academic_assessment_group_id,
            'submission_id' => $attempt?->id, 'submission_version' => $attempt?->version,
            'validator_id' => $validator->id, 'validated_at' => $now,
        ];
    }
}
