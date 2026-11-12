<?php

namespace App\Modules\Results\Application;

use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\Student\AcademicDeliberation;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\AcademicResultRule;
use App\Models\Student\ServiceRequest;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class Deliberations
{
    public function __construct(private ResultsAccess $access, private ResultInputs $inputs) {}

    public function prepare(AcademicResultRule $rule, User $actor, array $input): AcademicDeliberation
    {
        $this->access->staff($actor, $this->access->faculty($rule->version), ResultsAccess::MANAGE);

        return DB::transaction(function () use ($rule, $actor, $input) {
            $this->lockSources();
            $rule = AcademicResultRule::lockForUpdate()->findOrFail($rule->id);
            $meeting = CarbonImmutable::parse($input['meeting_at'], 'Africa/Kinshasa');
            ResultRules::check($rule->approved_at !== null && $rule->effective_on->toDateString() <= $meeting->toDateString(),
                'rule', 'Le règlement approuvé doit être applicable à la date du jury.');
            $version = $rule->version;
            $key = implode(':', [$version->id, $rule->level_id, $rule->session_code]);
            $runs = AcademicDeliberation::where('scope_key', $key);
            $last = (clone $runs)->latest('edition')->first();
            $previous = (clone $runs)->where('state', 'published')->latest('edition')->first();
            ResultRules::check(! $last || in_array($last->state, ['published', 'abandoned'], true), 'rule', 'Une délibération est déjà en préparation.');
            ResultRules::check(! $previous || ($previous->academic_result_rule_id === $rule->id && (int) ($input['previous_id'] ?? 0) === $previous->id),
                'previous_id', 'Une rectification doit référencer la dernière publication et conserver son règlement.');
            ResultRules::check($previous !== null || ! isset($input['previous_id']), 'previous_id', 'La publication de référence ne correspond pas à cette session.');
            if (isset($input['appeal_id'])) {
                ResultRules::check($previous && ServiceRequest::whereKey($input['appeal_id'])->where('status', 'accepted')
                    ->whereHas('officialResult', fn ($result) => $result->where('academic_deliberation_id', $previous->id))->exists(),
                    'appeal_id', 'Le recours doit être accepté et concerner la dernière publication.');
            }
            $faculty = $this->access->faculty($version);
            $jury = $this->jury($input, $faculty, (int) $rule->configuration['quorum']);
            $roster = $this->inputs->roster($rule);
            $units = $this->inputs->units($rule);
            ResultRules::check($roster->exists(), 'rule', 'Aucun dossier éligible pour ce règlement.');
            $equivalences = $this->equivalences($rule, $input['equivalences'] ?? [], $units, $roster);
            $run = AcademicDeliberation::create([
                'academic_result_rule_id' => $rule->id, 'previous_id' => $previous?->id, 'scope_key' => $key,
                'edition' => ($last?->edition ?? 0) + 1, 'reference' => (string) Str::uuid(), 'jury' => $jury,
                'meeting_at' => $meeting->utc(),
                'context' => [
                    'faculty_id' => $faculty, 'faculty' => $version->program_snapshot['faculty'] ?? $version->program->faculty->name,
                    'university' => $version->program_snapshot['university'] ?? $version->program->cycle->university->name,
                    'program' => $version->program_snapshot['name'] ?? $version->program->name,
                    'program_id' => $version->academic_program_id, 'curriculum' => $version->code, 'curriculum_id' => $version->id,
                    'level' => Level::findOrFail($rule->level_id)->title, 'level_id' => $rule->level_id,
                    'year' => $version->academicYear->title, 'year_id' => $version->academic_year_id,
                    'session' => $rule->session_code, 'regulation' => $rule->reference, 'regulation_version' => $rule->code,
                    'scale' => $rule->configuration['scale'], 'credit_label' => $rule->configuration['credit_label'],
                    'decisions' => $rule->configuration['decisions'],
                ],
            ]);
            $roster->with('profile.user')->chunkById(100, function ($entries) use ($rule, $units, $equivalences, $run) {
                foreach ($this->inputs->calculate($rule, $units, $entries, $equivalences) as $id => $snapshot) {
                    $run->results()->create(['academic_enrollment_id' => $id, 'snapshot' => $snapshot, 'reference' => (string) Str::uuid()]);
                }
            });
            Audit::record($actor->id, $previous ? 'official_result_rectification_prepared' : 'academic_deliberation_prepared',
                $run, $input['reason'], ['rule_id' => $rule->id, 'previous_id' => $previous?->id, 'appeal_id' => $input['appeal_id'] ?? null, 'equivalences' => count($input['equivalences'] ?? [])]);

            return $run;
        }, 3);
    }

    public function decision(AcademicDeliberation $run, AcademicOfficialResult $result, User $actor, array $input): void
    {
        DB::transaction(function () use ($run, $result, $actor, $input) {
            $run = AcademicDeliberation::lockForUpdate()->findOrFail($run->id);
            $this->access->jury($actor, $run);
            $this->revision($run, $input['revision']);
            ResultRules::check($run->state === 'open', 'state', 'Ouvrez la délibération avant de saisir la décision.');
            $result = $run->results()->findOrFail($result->id);
            $decision = $run->context['decisions'][$input['decision']] ?? null;
            $snapshot = $result->snapshot;
            ResultRules::check($decision && ResultRules::permitsDecision($decision, $snapshot), 'decision', 'Le dossier ne remplit pas les conditions du règlement pour cette décision.');
            $before = $result->decision;
            $result->update(['decision' => $input['decision'], 'decision_reason' => $input['reason'], 'decided_by' => $actor->id]);
            $run->increment('revision');
            Audit::record($actor->id, 'academic_jury_decided', $result, $input['reason'], ['before' => $before, 'after' => $input['decision'], 'rule_id' => $run->academic_result_rule_id]);
        }, 3);
    }

    public function transition(AcademicDeliberation $run, User $actor, array $input): void
    {
        $action = $input['action'];
        $changed = DB::transaction(function () use ($run, $actor, $input, $action) {
            if (in_array($action, ['approve', 'publish'], true)) {
                $this->lockSources();
            }
            $run = AcademicDeliberation::lockForUpdate()->findOrFail($run->id);
            $faculty = $run->context['faculty_id'];
            match ($action) {
                'open', 'approve' => $this->access->jury($actor, $run, chair: true),
                'publish' => $this->access->staff($actor, $faculty, ResultsAccess::PUBLISH),
                'abandon' => $this->access->staff($actor, $faculty, ResultsAccess::MANAGE),
            };
            $next = ['open' => 'open', 'approve' => 'approved', 'publish' => 'published', 'abandon' => 'abandoned'][$action];
            if ($run->state === $next) {
                return false;
            }
            $this->revision($run, $input['revision']);
            $fields = ['state' => $next, 'revision' => $run->revision + 1];
            if ($action === 'open') {
                ResultRules::check($run->state === 'prepared' && now()->gte($run->meeting_at), 'state', 'L’ouverture exige un dossier préparé et la date prévue du jury.');
                $attendance = array_map('intval', $input['attendance'] ?? []);
                ResultRules::check(count($attendance) >= $run->rule->configuration['quorum'] && array_diff($attendance, array_keys($run->jury['members'])) === []
                    && in_array($run->jury['chair'], $attendance, true) && in_array($run->jury['secretary'], $attendance, true), 'attendance',
                    'Le président, le secrétaire et le quorum du règlement doivent être présents.');
                foreach (User::whereKey($attendance)->get() as $member) {
                    $this->access->staff($member, $faculty, ResultsAccess::JURY);
                }
                $fields['attendance'] = $attendance;
            } elseif ($action === 'approve') {
                ResultRules::check($run->state === 'open' && ! $run->results()->whereNull('decision')->exists(), 'state',
                    'Le jury doit décider chaque dossier avant approbation.');
                $this->verifyInputs($run);
                $fields['approved_at'] = now();
            } elseif ($action === 'publish') {
                ResultRules::check($run->state === 'approved' && $run->approved_at !== null, 'state', 'Publiez une délibération approuvée.');
                $this->verifyInputs($run);
                $fields['published_at'] = now();
                $fields['published_by'] = $actor->id;
            } else {
                ResultRules::check(in_array($run->state, ['prepared', 'open', 'approved'], true), 'state', 'Une publication officielle exige une édition de rectification.');
            }
            $run->update($fields);
            Audit::record($actor->id, 'academic_deliberation_'.$next, $run, $input['reason'], ['rule_id' => $run->academic_result_rule_id]);

            return true;
        }, 3);
        if ($changed && $action === 'publish' && ($input['notify'] ?? false)) {
            app(ResultNotices::class)->publication($run->fresh());
        }
    }

    private function verifyInputs(AcademicDeliberation $run): void
    {
        $rule = $run->rule;
        $roster = $this->inputs->roster($rule);
        $units = $this->inputs->units($rule);
        ResultRules::check((clone $roster)->count() === $run->results()->count(), 'state', 'Le périmètre a changé. Préparez une nouvelle édition.');
        $roster->with('profile.user')->chunkById(100, function ($entries) use ($run, $rule, $units) {
            $saved = $run->results()->whereIn('academic_enrollment_id', $entries->modelKeys())->get()->keyBy('academic_enrollment_id');
            $current = $this->inputs->calculate($rule, $units, $entries, $saved->map(fn ($result) => $result->snapshot['equivalences'])->all());
            foreach ($current as $id => $snapshot) {
                ResultRules::check($saved->has($id) && $saved[$id]->snapshot == $snapshot, 'state',
                    'Des notes ou inscriptions ont changé. Préparez une nouvelle édition.');
            }
        });
    }

    private function jury(array $input, int $faculty, int $quorum): array
    {
        $ids = array_map('intval', $input['members']);
        $chair = (int) $input['chair'];
        $secretary = (int) $input['secretary'];
        ResultRules::check(count($ids) >= $quorum && $chair !== $secretary && in_array($chair, $ids, true)
            && in_array($secretary, $ids, true), 'members', 'Désignez un président et un secrétaire distincts parmi les membres du jury.');
        $users = User::whereKey($ids)->whereNotNull('email_verified_at')->get();
        ResultRules::check($users->count() === count($ids), 'members', 'Choisissez des membres disposant de comptes vérifiés.');
        foreach ($users as $member) {
            $this->access->staff($member, $faculty, ResultsAccess::JURY);
        }

        return ['chair' => $chair, 'secretary' => $secretary, 'members' => $users->pluck('full_name', 'id')->all(), 'ids' => $ids];
    }

    private function equivalences(AcademicResultRule $rule, array $rows, array $units, $roster): array
    {
        $mapped = [];
        $ids = collect($units)->flatMap(fn ($unit) => $unit['items'])->pluck('id')->all();
        ResultRules::check($rows === [] || $rule->configuration['allow_equivalence'], 'equivalences', 'Le règlement ne permet pas les équivalences.');
        $eligible = (clone $roster)->whereIn('id', array_column($rows, 'enrollment'))->pluck('id')->flip();
        $references = [];
        foreach ($rows as $row) {
            $entry = (int) $row['enrollment'];
            $item = (int) $row['item'];
            $key = $entry.':'.$row['reference'];
            ResultRules::check($eligible->has($entry) && in_array($item, $ids, true)
                && ! isset($mapped[$entry][$item]) && ! isset($references[$key]), 'equivalences', 'Référence ou EC d’équivalence en double ou hors périmètre.');
            $references[$key] = true;
            $mapped[$entry][$item] = $row['reference'];
        }

        return $mapped;
    }

    private function revision(AcademicDeliberation $run, int|string $revision): void
    {
        ResultRules::check($run->revision === (int) $revision, 'revision', 'Le dossier a changé. Rechargez la page.');
    }

    private function lockSources(): void
    {
        // Assessment validation takes this same lock before creating a handoff.
        AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
    }
}
