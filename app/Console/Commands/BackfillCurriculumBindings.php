<?php

namespace App\Console\Commands;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicYear;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use Illuminate\Console\Command;

final class BackfillCurriculumBindings extends Command
{
    protected $signature = 'curriculum:backfill-bindings
        {--actor= : Identifiant de l’administrateur responsable}
        {--year= : Limiter à cet identifiant d’année académique}
        {--apply : Enregistrer les rattachements}';

    protected $description = 'Rattacher les inscriptions existantes à leur maquette annuelle publiée. Aperçu par défaut.';

    public function handle(CurriculumService $curricula): int
    {
        $actorId = filter_var($this->option('actor'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $actor = $actorId ? User::find($actorId) : null;
        if (! $actor || ! $actor->can('manage', AcademicProgram::class)) {
            $this->error('Indiquez avec --actor un administrateur autorisé à gérer la structure académique.');

            return self::FAILURE;
        }

        $year = $this->option('year');
        $yearId = $year === null ? null : filter_var($year, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($yearId === false || ($yearId !== null && ! AcademicYear::whereKey($yearId)->exists())) {
            $this->error('Indiquez avec --year un identifiant d’année académique valide.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');
        $count = $curricula->backfillAnnualBindings($actor, $yearId, dryRun: ! $apply);
        $this->info($apply ? "Inscriptions rattachées : $count" : "Rattachements possibles : $count");

        return self::SUCCESS;
    }
}
