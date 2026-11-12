<?php

namespace App\Console\Commands;

use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use Illuminate\Console\Command;

final class AuditAssessments extends Command
{
    protected $signature = 'academic:assessment-audit {--details : Afficher les identifiants des ressources historiques}';

    protected $description = 'Inventorie les devoirs et évaluations historiques sans les rattacher ni modifier les copies';

    public function handle(): int
    {
        $legacy = AcademicResource::whereIn('kind', ['assignment', 'evaluation'])->whereDoesntHave('assessment');
        $this->table(['Indicateur', 'Nombre'], [
            ['Activités historiques', (clone $legacy)->count()],
            ['Activités historiques publiées', (clone $legacy)->where('is_published', true)->count()],
            ['Copies historiques', AcademicSubmission::whereIn('academic_resource_id', (clone $legacy)->select('id'))->count()],
            ['Évaluations sans séance explicite', (clone $legacy)->where('kind', 'evaluation')->whereNull('academic_session_id')->count()],
            ['Résultats historiques conservés séparément', AcademicResource::where('kind', 'result')->count()],
        ]);
        if ($this->option('details')) {
            $legacy->select(['id', 'academic_offering_id', 'kind'])->eachById(fn ($resource) => $this->line(
                "Ressource {$resource->id} · Offre {$resource->academic_offering_id} · {$resource->kind}"
            ));
        }

        return self::SUCCESS;
    }
}
