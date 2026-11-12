<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\FinanceTariff;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class FeeTariffService
{
    public function authorize(User $actor, ?int $levelId, ?int $programId): void
    {
        abort_unless($actor->hasRole('admin') && $actor->can('manage academic finance'), 403);
        $level = $levelId ? Level::findOrFail($levelId) : null;
        $program = $programId ? AcademicProgram::findOrFail($programId) : null;
        if ($level && $program && ! $program->levels()->whereKey($level->id)->exists()) {
            throw ValidationException::withMessages(['level_id' => 'Le niveau doit appartenir au programme.']);
        }
        if ($actor->academicFaculties()->exists()) {
            $faculty = $program?->faculty_id ?? $level?->faculty_id;
            abort_unless($faculty && $actor->academicFaculties()->whereKey($faculty)->exists(), 403);
        }
    }

    public function create(User $actor, array $data): FinanceTariff
    {
        $this->authorize($actor, $data['level_id'] ?? null, $data['academic_program_id'] ?? null);

        return DB::transaction(function () use ($actor, $data) {
            $year = AcademicYear::lockForUpdate()->findOrFail($data['academic_year_id']);
            if (! in_array($data['currency'], config('finance.currencies'), true)) {
                throw ValidationException::withMessages(['currency' => 'Cette devise doit être explicitement configurée.']);
            }
            if ($data['valid_from'] < $year->start_date || ($data['valid_until'] ?? $data['valid_from']) > $year->end_date) {
                throw ValidationException::withMessages(['valid_from' => 'La validité doit appartenir à l’année académique.']);
            }
            if (! empty($data['academic_program_id']) && ! empty($data['academic_cycle_id']) && ! AcademicProgram::whereKey($data['academic_program_id'])->where('academic_cycle_id', $data['academic_cycle_id'])->exists()) {
                throw ValidationException::withMessages(['academic_cycle_id' => 'Le cycle ne correspond pas au programme.']);
            }
            if (empty($data['schedule']) || count($data['schedule']) > 24) {
                throw ValidationException::withMessages(['schedule' => 'Un barème comporte entre 1 et 24 échéances.']);
            }
            $schedule = collect($data['schedule'])->map(function ($row) use ($data) {
                $amount = Money::cents($row['amount']);
                if ($amount <= 0 || $row['due_at'] < $data['valid_from']) {
                    throw ValidationException::withMessages(['schedule' => 'Chaque échéance doit être positive et datée à partir du début de validité.']);
                }

                return ['amount_cents' => $amount, 'due_at' => $row['due_at']];
            })->sortBy('due_at')->values()->all();
            $scope = array_intersect_key($data, array_flip(['academic_year_id', 'academic_program_id', 'academic_cycle_id', 'level_id', 'category', 'kind', 'currency']));
            foreach (['academic_program_id', 'academic_cycle_id', 'level_id'] as $key) {
                $scope[$key] = isset($scope[$key]) ? (int) $scope[$key] : null;
            }
            $scope['academic_year_id'] = (int) $scope['academic_year_id'];
            ksort($scope);
            $key = hash('sha256', json_encode($scope));
            $version = (int) FinanceTariff::where('scope_key', $key)->max('version') + 1;
            $tariff = FinanceTariff::create($scope + ['scope_key' => $key, 'version' => $version, 'title' => $data['title'], 'valid_from' => $data['valid_from'], 'valid_until' => $data['valid_until'] ?? null, 'schedule' => $schedule, 'created_by' => $actor->id, 'reason' => $data['reason']]);
            Audit::record($actor->id, 'finance_tariff_created', $tariff, $data['reason'], ['version' => $version]);

            return $tariff;
        }, 3);
    }

    public function activate(FinanceTariff $tariff, User $actor, string $reason, ?int $replaceId = null): void
    {
        $this->authorize($actor, $tariff->level_id, $tariff->academic_program_id);
        DB::transaction(function () use ($tariff, $actor, $reason, $replaceId) {
            AcademicYear::lockForUpdate()->findOrFail($tariff->academic_year_id);
            $tariff = FinanceTariff::lockForUpdate()->findOrFail($tariff->id);
            if ($tariff->status === 'active') {
                return;
            }
            if ($tariff->status !== 'draft') {
                throw ValidationException::withMessages(['tariff' => 'Créez une nouvelle version pour un barème archivé.']);
            }
            $overlap = FinanceTariff::where('scope_key', $tariff->scope_key)->where('status', 'active')
                ->where('valid_from', '<=', $tariff->valid_until ?? '9999-12-31')->where(fn ($q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', $tariff->valid_from))->lockForUpdate()->get();
            foreach ($overlap as $old) {
                if ($replaceId !== $old->id || $overlap->count() > 1) {
                    throw ValidationException::withMessages(['replace_id' => 'Un barème actif chevauche cette validité. Désignez explicitement la version remplacée.']);
                }
                $old->update(['status' => 'archived']);
                Audit::record($actor->id, 'finance_tariff_archived', $old, $reason, ['replacement_id' => $tariff->id]);
            }
            $tariff->update(['status' => 'active']);
            Audit::record($actor->id, 'finance_tariff_activated', $tariff, $reason);
        }, 3);
    }

    public function resolve(AcademicEnrollment $entry, string $category): ?FinanceTariff
    {
        $program = $entry->curriculumVersion?->program;

        return FinanceTariff::where('academic_year_id', $entry->academic_year_id)->where('kind', 'tuition')->where('category', $category)->where('currency', $entry->currency)->where('status', 'active')
            ->where('valid_from', '<=', today('Africa/Kinshasa'))->where(fn ($q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', today('Africa/Kinshasa')))
            ->where(fn ($q) => $q->whereNull('level_id')->orWhere('level_id', $entry->level_id))
            ->where(fn ($q) => $q->whereNull('academic_program_id')->orWhere('academic_program_id', $program?->id ?? -1))
            ->where(fn ($q) => $q->whereNull('academic_cycle_id')->orWhere('academic_cycle_id', $program?->academic_cycle_id ?? -1))
            ->orderByRaw('CASE WHEN level_id IS NULL THEN 0 ELSE 8 END + CASE WHEN academic_program_id IS NULL THEN 0 ELSE 4 END + CASE WHEN academic_cycle_id IS NULL THEN 0 ELSE 2 END DESC')->latest('version')->first();
    }

    public function bill(FinanceTariff $tariff, AcademicEnrollment $entry, User $actor, string $reason): void
    {
        app(StudentFinanceService::class)->authorize($entry, $actor);
        $this->authorize($actor, $tariff->level_id, $tariff->academic_program_id);
        DB::transaction(function () use ($tariff, $entry, $actor, $reason) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            $tariff = FinanceTariff::lockForUpdate()->findOrFail($tariff->id);
            $program = $entry->curriculumVersion?->program;
            if ($tariff->status !== 'active' || (int) $tariff->academic_year_id !== (int) $entry->academic_year_id || $tariff->currency !== $entry->currency
                || ($tariff->level_id && (int) $tariff->level_id !== (int) $entry->level_id) || ($tariff->academic_program_id && (int) $tariff->academic_program_id !== (int) $program?->id)
                || ($tariff->academic_cycle_id && (int) $tariff->academic_cycle_id !== (int) $program?->academic_cycle_id)
                || $tariff->valid_from->toDateString() > today('Africa/Kinshasa')->toDateString() || ($tariff->valid_until && $tariff->valid_until->toDateString() < today('Africa/Kinshasa')->toDateString())) {
                throw ValidationException::withMessages(['tariff' => 'Le barème ne correspond pas au contexte, à la devise ou à sa validité.']);
            }
            $existing = $entry->obligations()->where('kind', $tariff->kind)->get();
            if ($existing->isNotEmpty()) {
                if ($existing->every(fn ($o) => (int) $o->finance_tariff_id === (int) $tariff->id)) {
                    return;
                }
                throw ValidationException::withMessages(['tariff' => 'Des obligations existent déjà ; aucune nouvelle version ne les remplace automatiquement.']);
            }
            foreach ($tariff->schedule as $index => $row) {
                $entry->obligations()->create(['finance_tariff_id' => $tariff->id, 'kind' => $tariff->kind, 'title' => $tariff->title.' · Échéance '.($index + 1), 'installment' => $index + 1, 'currency' => $tariff->currency, 'amount_cents' => $row['amount_cents'], 'due_at' => $row['due_at'], 'source_snapshot' => $tariff->only(['id', 'version', 'title', 'category', 'currency', 'schedule'])]);
            }
            if ($tariff->kind === 'tuition') {
                $entry->update(['fee_category' => $tariff->category]);
            }
            Audit::record($actor->id, 'finance_tariff_billed', $entry, $reason, ['tariff_id' => $tariff->id, 'version' => $tariff->version]);
            app(StudentFinanceService::class)->confirmPendingEnrollment($entry, $actor->id);
        }, 3);
    }
}
