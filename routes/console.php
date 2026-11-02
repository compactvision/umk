<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Artisan::command('student:activate-validated {--dry-run : Afficher uniquement les dossiers à traiter} {--notify : Notifier les nouveaux accès}', function () {
    $entries = \App\Models\Enrollment::where('status', 'validated')->whereDoesntHave('academicEnrollment')->get();
    $failures = 0;
    foreach ($entries as $application) {
        if ($this->option('dry-run')) {
            $this->line($application->reference);

            continue;
        }
        try {
            app(\App\Modules\Student\Application\Services\StudentAdmissionService::class)->activate($application, null, (bool) $this->option('notify'));
            $this->info('Activé : '.$application->reference);
        } catch (\Throwable $e) {
            $failures++;
            $this->error($application->reference.' : '.$e->getMessage());
        }
    }

    return $failures ? 1 : 0;
})->purpose('Activer les espaces des dossiers déjà validés, sans recréer de compte ou de matricule.');

Artisan::command('student:migrate-matricules {--dry-run : Prévisualiser sans modifier les données}', function () {
    try {
        $changes = app(\App\Modules\Student\Application\Services\StudentMatriculeMigration::class)->run((bool) $this->option('dry-run'));
        foreach ($changes as $change) {
            $this->line($change['reference'].' : '.$change['previous'].' → '.$change['matricule']);
        }
        $this->info(count($changes).' dossier(s) '.($this->option('dry-run') ? 'à synchroniser (simulation sans écriture).' : 'synchronisé(s).'));

        return 0;
    } catch (\Throwable $exception) {
        $this->error('Aucune modification conservée : '.$exception->getMessage());

        return 1;
    }
})->purpose('Convertir et synchroniser les anciens matricules sans modifier les comptes ni les décisions.');
