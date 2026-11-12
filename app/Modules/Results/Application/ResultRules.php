<?php

namespace App\Modules\Results\Application;

use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\Student\AcademicAssessment;
use App\Models\Student\AcademicResultRule;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final class ResultRules
{
    public function __construct(private ResultsAccess $access) {}

    public function create(CurriculumVersion $version, User $actor, array $input): AcademicResultRule
    {
        $this->access->staff($actor, $this->access->faculty($version), ResultsAccess::MANAGE);
        self::check($version->published_at !== null && $version->academic_year_id !== null, 'version', 'Sélectionnez une maquette déjà publiée.');
        $data = $this->configuration($version, (int) $input['level_id'], $input['session_code'], $input['configuration']);
        $rule = AcademicResultRule::create([
            'curriculum_version_id' => $version->id, 'level_id' => $input['level_id'], 'session_code' => $input['session_code'],
            'code' => $input['code'], 'effective_on' => $input['effective_on'], 'reference' => $input['reference'],
            'configuration' => $data, 'author_id' => $actor->id,
        ]);
        Audit::record($actor->id, 'official_result_rule_created', $rule, $rule->reference);

        return $rule;
    }

    public function approve(AcademicResultRule $rule, User $actor, string $reason): void
    {
        $this->access->staff($actor, $this->access->faculty($rule->version), ResultsAccess::PUBLISH);
        DB::transaction(function () use ($rule, $actor, $reason) {
            $rule = AcademicResultRule::lockForUpdate()->findOrFail($rule->id);
            if ($rule->approved_at) {
                return;
            }
            self::check($rule->author_id !== $actor->id, 'rule', 'La validation du règlement exige une autre personne habilitée.');
            $this->configuration($rule->version, $rule->level_id, $rule->session_code, $rule->configuration);
            $rule->update(['approved_by' => $actor->id, 'approved_at' => now()]);
            Audit::record($actor->id, 'official_result_rule_approved', $rule, $reason);
        });
    }

    private function configuration(CurriculumVersion $version, int $level, string $session, array $input): array
    {
        $data = Validator::make($input, [
            'scale' => 'required|integer|between:1,1000000', 'precision' => 'required|integer|between:0,2',
            'rounding' => 'required|in:half_up,half_even,down', 'weighting' => 'required|in:uniform,credits,coefficients',
            'ec_pass' => 'required|integer|min:0|lte:scale', 'ue_pass' => 'required|integer|min:0|lte:scale',
            'eliminatory_below' => 'nullable|integer|min:0|lte:ec_pass',
            'compensation' => 'required|in:none,unit,period', 'compensation_floor' => 'nullable|required_unless:compensation,none|integer|min:0|lte:ec_pass',
            'period_pass' => 'nullable|required_if:compensation,period|integer|min:0|lte:scale',
            'appeal_days' => 'required|integer|between:0,365', 'quorum' => 'required|integer|between:2,25',
            'allow_equivalence' => 'required|boolean', 'credit_label' => 'required|string|max:25',
            'base_rule_id' => 'nullable|integer|min:1', 'resit_policy' => 'required_with:base_rule_id|nullable|in:replace,best,keep',
            'resit_eligibility' => 'required_with:base_rule_id|nullable|in:failed_ec,failed_unit,all_registered',
            'missing_resit' => 'required_with:base_rule_id|nullable|in:retain,incomplete',
            'decisions' => 'required|array|min:1|max:25', 'decisions.*' => 'required|array:label,permits_incomplete,permits_eliminatory,progression,minimum_credits,retake,completion_credits,completion_evidence,completion_alignment',
            'decisions.*.label' => 'required|string|max:100', 'decisions.*.permits_incomplete' => 'required|boolean',
            'decisions.*.permits_eliminatory' => 'required|boolean', 'decisions.*.progression' => 'required|in:none,same,next,conditional',
            'decisions.*.retake' => 'nullable|in:unacquired_units,whole_year',
            'decisions.*.completion_credits' => 'nullable|integer|min:1|max:10000000',
            'decisions.*.completion_alignment' => 'nullable|in:exact_version,identical_units',
            'decisions.*.completion_evidence' => 'nullable|string|min:5|max:500',
            'decisions.*.minimum_credits' => 'nullable|integer|min:0|max:10000000',
            'items' => 'required|array|max:500', 'items.*' => 'present|array|max:30', 'items.*.*' => 'required|integer|between:1,10000',
        ])->validate();
        foreach (['scale', 'precision', 'ec_pass', 'ue_pass', 'eliminatory_below', 'compensation_floor', 'period_pass', 'appeal_days', 'quorum', 'base_rule_id'] as $key) {
            if (isset($data[$key])) {
                $data[$key] = (int) $data[$key];
            }
        }
        foreach ($data['decisions'] as $key => $decision) {
            self::check(preg_match('/^[a-z][a-z0-9_-]{0,58}$/D', (string) $key) === 1, 'configuration', 'Utilisez des codes de décision stables.');
            self::check($decision['progression'] === 'none' || (! $decision['permits_incomplete'] && ! $decision['permits_eliminatory']),
                'configuration', 'Une décision de progression exige un dossier complet sans élimination.');
            self::check($decision['progression'] !== 'conditional' || ($decision['retake'] ?? null) === 'unacquired_units',
                'configuration', 'Un passage conditionnel doit définir la reprise des UE non acquises.');
            self::check(empty($decision['retake']) || in_array($decision['progression'], ['same', 'conditional'], true),
                'configuration', 'Le plan de reprise exige un redoublement ou un passage conditionnel.');
            self::check(empty($decision['completion_credits']) || ($decision['progression'] === 'none'
                && ! $decision['permits_incomplete'] && ! $decision['permits_eliminatory']),
                'configuration', 'La fin de cursus exige une décision finale complète et distincte d’un passage.');
            self::check((empty($decision['completion_evidence']) && empty($decision['completion_alignment'])) || ! empty($decision['completion_credits']),
                'configuration', 'Les exigences complémentaires doivent relever d’une règle de fin de cursus.');
        }
        $base = isset($data['base_rule_id']) ? AcademicResultRule::find($data['base_rule_id']) : null;
        if (isset($data['base_rule_id'])) {
            self::check($base && $base->approved_at && $base->curriculum_version_id === $version->id && $base->level_id === $level
                && $base->session_code !== $session && ! isset($base->configuration['base_rule_id'])
                && $base->configuration['scale'] === $data['scale'], 'configuration', 'Le rattrapage exige un règlement ordinaire approuvé de même contexte et échelle.');
        } else {
            self::check(empty($data['resit_policy']) && empty($data['missing_resit']) && empty($data['resit_eligibility']), 'configuration', 'Associez une session ordinaire pour appliquer une règle de rattrapage.');
        }
        $items = $version->units()->where('level_id', $level)->with('items')->get()->flatMap->items->keyBy('id');
        self::check($items->isNotEmpty() && count($data['items']) === $items->count(), 'configuration', 'Déclarez les sources de chaque EC du niveau.');
        self::check($data['weighting'] === 'uniform' || in_array($version->weighting_mode, [$data['weighting'], 'both'], true),
            'configuration', 'La pondération doit être compatible avec la maquette.');
        $seen = [];
        foreach ($data['items'] as $item => $weights) {
            self::check($items->has($item) && ($weights === [] ? $base !== null : array_sum($weights) === 10000),
                'configuration', 'Chaque EC ordinaire doit totaliser 10 000 points de pondération.');
            foreach ($weights as $assessment => $weight) {
                self::check(ctype_digit((string) $assessment) && ! isset($seen[$assessment]), 'configuration', 'Une évaluation ne peut être comptée qu’une fois.');
                $seen[$assessment] = (int) $item;
            }
        }
        $sources = AcademicAssessment::whereIn('id', array_keys($seen))->with('resource.offering')->get()->keyBy('id');
        foreach ($seen as $id => $item) {
            $assessment = $sources->get($id);
            $offer = $assessment?->resource?->offering;
            self::check($offer && $offer->curriculum_item_id === $item && $offer->academic_year_id === $version->academic_year_id
                && $assessment->session_code === $session && $assessment->maximum_points !== null && $assessment->state !== 'cancelled',
                'configuration', 'Chaque source doit être une évaluation chiffrée de l’EC, de l’année et de la session déclarés.');
        }

        return $data;
    }

    public static function permitsDecision(array $decision, array $snapshot): bool
    {
        return ($decision['permits_incomplete'] || $snapshot['anomalies'] === [])
            && ($decision['permits_eliminatory'] || ! $snapshot['eliminatory'])
            && ($decision['minimum_credits'] ?? 0) <= $snapshot['credits']['earned'];
    }

    public static function check(bool $condition, string $field, string $message): void
    {
        if (! $condition) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }
}
