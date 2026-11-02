<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AccessRule;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AcademicRuleService
{
    public function save(User $actor, array $data): AccessRule
    {
        abort_unless($actor->can('manage academic access'), 403);
        if ($data['mode'] === 'minimum' && (! isset($data['minimum']) || Money::cents($data['minimum']) <= 0)) {
            throw ValidationException::withMessages(['minimum' => 'Un acompte positif est obligatoire pour ce mode.']);
        }
        if (in_array($data['feature'], config('student.regulated'), true) && $data['mode'] !== 'open' && (! (bool) ($data['regulation_confirmed'] ?? false) || mb_strlen(trim($data['regulation_reference'] ?? '')) < 10)) {
            throw ValidationException::withMessages(['regulation_reference' => 'Cette restriction exige une référence au règlement applicable et une validation explicite de l’administration.']);
        }

        return DB::transaction(function () use ($actor, $data) {
            AccessRule::where('feature', $data['feature'])->where('academic_year_id', $data['academic_year_id'] ?? null)->where('level_id', $data['level_id'] ?? null)->where('is_active', true)->lockForUpdate()->get()->each->update(['is_active' => false]);
            $rule = AccessRule::create(['feature' => $data['feature'], 'academic_year_id' => $data['academic_year_id'] ?? null, 'level_id' => $data['level_id'] ?? null, 'fee_kind' => $data['fee_kind'] ?? 'tuition', 'mode' => $data['mode'], 'minimum_cents' => isset($data['minimum']) ? Money::cents($data['minimum']) : null, 'allow_plan' => (bool) ($data['allow_plan'] ?? false), 'allow_exemption' => (bool) ($data['allow_exemption'] ?? false), 'regulation_reference' => $data['regulation_reference'] ?? null]);
            Audit::record($actor->id, 'academic_access_rule_created', $rule, $data['reason'], ['rule' => $rule->toArray(), 'regulation_confirmed' => (bool) ($data['regulation_confirmed'] ?? false)]);

            return $rule;
        });
    }
}
