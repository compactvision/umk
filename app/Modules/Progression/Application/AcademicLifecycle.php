<?php

namespace App\Modules\Progression\Application;

use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicLifecycleCase;
use App\Models\Student\AcademicProgression;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\Results\Application\ResultInputs;
use App\Modules\Results\Application\ResultRules;
use App\Modules\Student\Application\Services\AcademicEnrollmentService;
use App\Modules\Student\Application\Services\AcademicProgressionService;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

final class AcademicLifecycle
{
    public const MANAGE = 'manage academic progression';

    public const APPROVE = 'approve academic progression';

    public const GRADUATE = 'approve academic graduation';

    public function __construct(private AcademicEnrollmentService $enrollments, private AcademicProgressionService $progressions,
        private ResultInputs $results, private GraduationEvidence $graduation) {}

    public function propose(AcademicEnrollment $entry, User $actor, array $data): AcademicLifecycleCase
    {
        $this->authorize($entry, $actor, self::MANAGE);

        return DB::transaction(function () use ($entry, $actor, $data) {
            $entry = $this->lock($entry);
            $kind = $data['kind'];
            $details = $this->details($data);
            $hash = hash('sha256', json_encode([$kind, $details, $data['reason']], JSON_THROW_ON_ERROR));
            $existing = AcademicLifecycleCase::where('academic_enrollment_id', $entry->id)->where('operation_key', $data['operation_key'])->first();
            if ($existing) {
                ResultRules::check(hash_equals($existing->context['operation_hash'], $hash), 'operation_key', 'Cette clé correspond à une autre opération.');

                return $existing;
            }
            $pending = $entry->id.':'.$kind;
            ResultRules::check(! AcademicLifecycleCase::where('pending_key', $pending)->exists(), 'kind', 'Un dossier de ce type est déjà ouvert.');
            $case = AcademicLifecycleCase::create([
                'reference' => (string) Str::uuid(), 'academic_enrollment_id' => $entry->id, 'author_id' => $actor->id,
                'kind' => $kind, 'status' => 'open', 'reason' => $data['reason'], 'operation_key' => $data['operation_key'], 'pending_key' => $pending,
                'context' => $this->caseContext($entry, $kind, $details) + ['operation_hash' => $hash],
            ]);
            Audit::record($actor->id, 'academic_lifecycle_proposed', $case, $case->reason, ['kind' => $kind]);

            return $case;
        }, 3);
    }

    public function decide(AcademicLifecycleCase $case, User $actor, array $data): void
    {
        $this->authorize($case->enrollment, $actor, self::APPROVE);
        abort_if($data['action'] === 'approve' && $case->kind === 'graduation' && ! $actor->can(self::GRADUATE), 403);
        DB::transaction(function () use ($case, $actor, $data) {
            $entry = $this->lock($case->enrollment);
            $case = AcademicLifecycleCase::lockForUpdate()->findOrFail($case->id);
            $status = match ($data['action']) {
                'approve' => 'approved', 'refuse' => 'refused', 'correct' => 'correction'
            };
            if ($case->status === $status && $case->revision === (int) $data['revision'] + 1 && $case->decided_by === $actor->id) {
                return;
            }
            ResultRules::check($case->status === 'open' && $case->revision === (int) $data['revision'], 'revision', 'Ce dossier a déjà été traité ou a changé.');
            abort_if($case->author_id === $actor->id, 403);
            $changes = [];
            if ($status === 'approved') {
                ResultRules::check($case->context['source'] == $this->context($entry), 'context', 'Le contexte source a changé. Déposez un dossier actualisé.');
                $changes = $this->apply($case, $entry, $actor, $data['reason']);
            }
            $case->fill($changes + [
                'status' => $status, 'revision' => $case->revision + 1, 'pending_key' => $status === 'correction' ? $case->pending_key : null,
                'decided_by' => $actor->id, 'decided_at' => now(), 'response' => $data['reason'],
            ])->save();
            Audit::record($actor->id, 'academic_lifecycle_'.$status, $case, $data['reason'], ['kind' => $case->kind]);
            if ($status !== 'correction') {
                ProgressionNotice::publish($entry, $status, $case->reference);
            }
        }, 3);
    }

    public function revise(AcademicLifecycleCase $case, User $actor, array $data): void
    {
        $this->authorize($case->enrollment, $actor, self::MANAGE);
        abort_unless($case->author_id === $actor->id, 403);

        DB::transaction(function () use ($case, $actor, $data) {
            $entry = $this->lock($case->enrollment);
            $case = AcademicLifecycleCase::lockForUpdate()->findOrFail($case->id);
            $details = $this->details($data);
            if ($case->status === 'open' && $case->revision === (int) $data['revision'] + 1
                && $case->reason === $data['reason'] && $case->context['request'] == $details) {
                return;
            }
            ResultRules::check($case->status === 'correction' && $case->revision === (int) $data['revision'],
                'revision', 'Une correction doit être demandée sur la version actuelle du dossier.');
            $previous = $case->only(['context', 'reason', 'response', 'revision']);
            $case->update([
                'context' => $this->caseContext($entry, $case->kind, $details) + ['operation_hash' => $case->context['operation_hash']],
                'status' => 'open', 'reason' => $data['reason'], 'revision' => $case->revision + 1, 'response' => null,
                'decided_by' => null, 'decided_at' => null,
            ]);
            Audit::record($actor->id, 'academic_lifecycle_revised', $case, $data['reason'], ['previous' => $previous]);
        }, 3);
    }

    private function details(array $data): array
    {
        $details = array_intersect_key($data, array_flip(['level_id', 'year_id', 'version_id', 'application_id', 'evidence']));
        ksort($details);

        return $details;
    }

    private function caseContext(AcademicEnrollment $entry, string $kind, array $details): array
    {
        return ['request' => $details, 'source' => $this->context($entry),
            'prepared_completion' => $kind === 'graduation' ? $this->graduation->verify($entry, $details['evidence'] ?? null) : null,
        ];
    }

    public static function interrupted(AcademicEnrollment $entry): bool
    {
        return AcademicLifecycleCase::where('academic_enrollment_id', $entry->id)->where('status', 'approved')
            ->whereIn('kind', ['interruption', 'resumption'])->latest('decided_at')->latest('id')->value('kind') === 'interruption';
    }

    private function apply(AcademicLifecycleCase $case, AcademicEnrollment $entry, User $actor, string $reason): array
    {
        $request = $case->context['request'];
        ResultRules::check($entry->application?->status?->value === 'validated', 'context', 'Une admission validée est requise.');
        switch ($case->kind) {
            case 'interruption':
                ResultRules::check(in_array($entry->enrollment_status, ['confirmed', 'completed', 'on_leave'], true) && ! self::interrupted($entry),
                    'kind', 'Ce parcours ne peut pas être interrompu dans sa situation actuelle.');

                return [];

            case 'resumption':
                ResultRules::check(self::interrupted($entry) && $entry->profile->student_status === 'active'
                    && in_array($entry->enrollment_status, ['confirmed', 'completed', 'on_leave', 'withdrawn'], true),
                    'kind', 'Une interruption approuvée et un dossier actif sont requis.');
                $year = $this->progressions->years($entry)->findOrFail($request['year_id'] ?? 0);
                $version = $this->progressions->targetVersions($entry, $year->id, $entry->level_id)->findOrFail($request['version_id'] ?? 0);
                $existing = AcademicProgression::where('source_enrollment_id', $entry->id)->lockForUpdate()->first();
                ResultRules::check(! $entry->profile->enrollments()->where('academic_year_id', $year->id)->exists()
                    && ! $existing?->target_enrollment_id, 'year_id', 'Une inscription cible existe déjà.');
                $previous = $existing?->only(['kind', 'level_id', 'academic_year_id', 'academic_official_result_id', 'decision_snapshot']);
                Gate::forUser($actor)->authorize('manage', $entry);
                $result = $this->results->latest($entry);
                $progression = $existing ?? new AcademicProgression;
                $progression->fill([
                    'source_enrollment_id' => $entry->id, 'level_id' => $entry->level_id, 'academic_year_id' => $year->id,
                    'target_curriculum_version_id' => $version->id, 'kind' => 'resumption', 'reason' => $reason,
                    'decided_by' => $actor->id, 'academic_official_result_id' => $result?->id,
                    'decision_snapshot' => ['curriculum_version_id' => $entry->curriculum_version_id, 'result_reference' => $result?->reference, 'case' => $case->reference],
                ])->save();
                Audit::record($actor->id, 'academic_resumption_authorized', $progression, $reason, ['previous' => $previous]);

                return ['academic_progression_id' => $progression->id, 'academic_official_result_id' => $result?->id];

            case 'reorientation':
                $level = Level::findOrFail($request['level_id'] ?? 0);
                $version = CurriculumVersion::with('program.cycle')->findOrFail($request['version_id'] ?? 0);
                ResultRules::check($entry->curriculumVersion && $version->program->academic_cycle_id === $entry->curriculumVersion->program->academic_cycle_id
                    && $version->program->cycle->university_id === $entry->level->faculty->university_id,
                    'version_id', 'Cette réorientation exige un même cycle et un même établissement.');
                $target = $this->enrollments->transfer($entry, $actor, [
                    'level_id' => $level->id, 'curriculum_version_id' => $version->id, 'operation_key' => $case->reference, 'reason' => $reason,
                ]);

                return ['target_enrollment_id' => $target->id];

            case 'external_transfer':
                ResultRules::check(filled($request['evidence'] ?? null), 'evidence', 'Consignez la référence de la décision et du dossier de transfert.');

                return [];

            case 'cycle':
                $result = $this->results->latest($entry);
                $completion = $result ? $this->graduation->approved($entry, $result) : null;
                $admission = Enrollment::findOrFail($request['application_id'] ?? 0);
                $target = $entry->profile->enrollments()->where('application_id', $admission->id)->whereKeyNot($entry->id)->with('curriculumVersion.program')->first();
                ResultRules::check($completion && $admission->status?->value === 'validated' && $admission->student_id === $entry->profile->user_id
                    && $target?->curriculumVersion && $target->curriculumVersion->program->academic_cycle_id !== $entry->curriculumVersion->program->academic_cycle_id,
                    'application_id', 'Le cycle achevé et une nouvelle admission validée du même étudiant sont requis.');
                TeachingScope::authorize($actor, $target->level->faculty_id, self::APPROVE);

                return ['target_enrollment_id' => $target->id, 'academic_official_result_id' => $result->id];

            case 'graduation':
                ResultRules::check(in_array($entry->enrollment_status, ['confirmed', 'completed'], true), 'graduation', 'L’inscription doit être confirmée ou achevée.');
                $evidence = $this->graduation->verify($entry, $request['evidence'] ?? null);
                ResultRules::check($evidence == $case->context['prepared_completion'], 'graduation',
                    'Les sources certifiées ont changé. Préparez un nouveau dossier.');
                ResultRules::check(! AcademicLifecycleCase::where('completion_key', $evidence['result_id'])->exists(), 'graduation',
                    'Cette édition de la décision de fin de cursus a déjà été validée.');
                $this->enrollments->completeGraduation($entry, $actor, $reason);

                return ['completion_key' => $evidence['result_id'], 'academic_official_result_id' => $evidence['result_id'],
                    'context' => $case->context + ['completion' => $evidence]];
        }

        throw new \LogicException('Transition de parcours inconnue.');
    }

    private function authorize(AcademicEnrollment $entry, User $actor, string $permission): void
    {
        TeachingScope::authorize($actor, $entry->level->faculty_id, $permission);
        Gate::forUser($actor)->authorize('view', $entry);
    }

    private function lock(AcademicEnrollment $entry): AcademicEnrollment
    {
        AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
        AcademicYear::lockForUpdate()->findOrFail($entry->academic_year_id);
        StudentProfile::lockForUpdate()->findOrFail($entry->student_profile_id);

        return AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
    }

    private function context(AcademicEnrollment $entry): array
    {
        return $entry->only(['curriculum_version_id', 'level_id', 'academic_year_id', 'enrollment_status'])
            + ['faculty_id' => $entry->level->faculty_id, 'university_id' => $entry->level->faculty->university_id];
    }
}
