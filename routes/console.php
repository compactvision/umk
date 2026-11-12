<?php

use App\Models\Student\AcademicEnrollment;
use App\Modules\Student\Application\Services\StudentFinanceService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

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

Artisan::command('student:confirm-covered-enrollments', function () {
    $finance = app(StudentFinanceService::class);
    AcademicEnrollment::where('enrollment_status', 'pending_confirmation')
        ->whereHas('obligations', fn ($query) => $query->where('kind', 'tuition')->where('installment', 1))
        ->select('id')->eachById(function (AcademicEnrollment $candidate) use ($finance) {
            DB::transaction(function () use ($candidate, $finance) {
                $entry = AcademicEnrollment::lockForUpdate()->find($candidate->id);
                if ($entry) {
                    $finance->confirmPendingEnrollment($entry);
                }
            });
        });
})->purpose('Confirmer les inscriptions en attente couvertes, y compris lors de la prise d’effet d’une aide.');

Schedule::command('student:confirm-covered-enrollments')->daily()->timezone('Africa/Kinshasa');
