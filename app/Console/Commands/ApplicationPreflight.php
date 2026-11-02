<?php

namespace App\Console\Commands;

use App\Support\ApplicationKey;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ApplicationPreflight extends Command
{
    protected $signature = 'app:preflight {--production : Vérifier les paramètres de production} {--database : Vérifier la connexion et les migrations} {--assets : Vérifier le manifeste et ses fichiers}';

    protected $description = 'Contrôler la configuration sans afficher ni modifier les secrets.';

    public function handle(): int
    {
        $errors = [];
        if ($error = ApplicationKey::error()) {
            $errors[] = $error.' Vérifiez le .env chargé et le cache de configuration ; restaurez la clé existante.';
        }
        if ($this->option('production')) {
            if (! app()->environment('production')) {
                $errors[] = 'APP_ENV doit être production.';
            }
            if (config('app.debug')) {
                $errors[] = 'APP_DEBUG doit être false.';
            }
            if (! str_starts_with(config('app.url'), 'https://')) {
                $errors[] = 'APP_URL doit utiliser le domaine HTTPS de production.';
            }
        }
        if ($this->option('production')) {
            foreach (['bootstrap/cache', 'storage/logs', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views'] as $directory) {
                if (! is_dir(base_path($directory)) || ! is_writable(base_path($directory))) {
                    $errors[] = 'Répertoire absent ou non accessible en écriture : '.$directory;
                }
            }
        }
        if ($this->option('database')) {
            try {
                DB::connection()->getPdo();
                $migrator = app('migrator');
                if (! $migrator->repositoryExists()) {
                    $errors[] = 'La table des migrations est absente.';
                } elseif (array_diff(array_keys($migrator->getMigrationFiles(database_path('migrations'))), $migrator->getRepository()->getRan())) {
                    $errors[] = 'Des migrations restent à exécuter.';
                }
            } catch (\Throwable $exception) {
                $errors[] = 'La base de données n’est pas accessible. Consultez les journaux du serveur.';
            }
        }
        if ($this->option('assets')) {
            $manifest = public_path('build/manifest.json');
            try {
                if (! is_readable($manifest)) {
                    throw new \RuntimeException('Manifeste absent.');
                }
                $entries = json_decode(file_get_contents($manifest), true, flags: JSON_THROW_ON_ERROR);
                if (! isset($entries['resources/js/app.tsx'])) {
                    $errors[] = 'Entrée Vite principale absente.';
                }
                foreach ($entries as $entry) {
                    foreach (array_merge([$entry['file']], $entry['css'] ?? []) as $file) {
                        if (! is_file(public_path('build/'.$file))) {
                            $errors[] = 'Un fichier du build Vite est absent. Recompilez et transférez le build complet.';
                            break 2;
                        }
                    }
                }
            } catch (\Throwable $exception) {
                $errors[] = 'Manifeste Vite absent ou illisible. Exécutez npm run build.';
            }
        }
        foreach ($errors as $error) {
            $this->error($error);
        }
        if ($errors) {
            return self::FAILURE;
        }
        $this->info('Configuration valide pour les contrôles demandés. Aucune clé ni donnée n’a été modifiée.');

        return self::SUCCESS;
    }
}
