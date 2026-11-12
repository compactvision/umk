<?php

namespace App\Console\Commands;

use App\Support\ApplicationKey;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

class ApplicationPreflight extends Command
{
    protected $signature = 'app:preflight {--production : Vérifier les paramètres de production} {--database : Vérifier la connexion et les migrations} {--assets : Vérifier le manifeste et ses fichiers} {--runtime : Vérifier le cache et la file configurée} {--http : Vérifier la disponibilité HTTP du endpoint /up}';

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
            $url = config('app.url');
            if (! filter_var($url, FILTER_VALIDATE_URL) || parse_url($url, PHP_URL_SCHEME) !== 'https') {
                $errors[] = 'APP_URL doit utiliser le domaine HTTPS de production.';
            }
            if (! config('session.secure') || ! config('session.http_only') || ! in_array(config('session.same_site'), ['lax', 'strict'], true)) {
                $errors[] = 'Les cookies de session doivent être Secure, HttpOnly et SameSite=Lax ou Strict.';
            }
            if (! extension_loaded('gd')) {
                $errors[] = 'L’extension PHP GD est requise pour les QR des documents officiels.';
            }
            if (! extension_loaded('zip')) {
                $errors[] = 'L’extension PHP ZIP est requise pour les rapports financiers Excel.';
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
            if ($this->option('production') && is_file(public_path('hot'))) {
                $errors[] = 'Le marqueur Vite public/hot doit être absent de la release.';
            }
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
        if ($this->option('runtime')) {
            $probe = 'preflight:'.Str::uuid();
            try {
                if (! Cache::put($probe, 'ready', 30) || Cache::get($probe) !== 'ready') {
                    $errors[] = 'Le cache configuré ne confirme pas la sonde.';
                }
            } catch (\Throwable) {
                $errors[] = 'Le cache configuré est indisponible.';
            } finally {
                try {
                    Cache::forget($probe);
                } catch (\Throwable) {
                    // The probe expires automatically.
                }
            }
            if (in_array(config('queue.default'), ['database', 'redis'], true)) {
                try {
                    $this->line('Profondeur de la file par défaut : '.Queue::size());
                } catch (\Throwable) {
                    $errors[] = 'La file par défaut est indisponible.';
                }
            }
        }
        if ($this->option('http')) {
            try {
                $response = Http::withoutRedirecting()->timeout(15)->get(rtrim(config('app.url'), '/').'/up');
                if ($response->status() !== 200) {
                    $errors[] = 'Le contrôle HTTP /up a échoué.';
                }
            } catch (\Throwable $exception) {
                $errors[] = 'Le contrôle HTTP /up est indisponible.';
            }
        }
        foreach ($errors as $error) {
            $this->error($error);
        }
        if ($errors) {
            return self::FAILURE;
        }
        $this->info('Configuration valide pour les contrôles demandés.');

        return self::SUCCESS;
    }
}
