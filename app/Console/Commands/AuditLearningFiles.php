<?php

namespace App\Console\Commands;

use App\Models\Student\AcademicResource;
use App\Models\Student\ResourceVersion;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

final class AuditLearningFiles extends Command
{
    protected $signature = 'academic:learning-file-audit';

    protected $description = 'Inventorie les références de fichiers pédagogiques et les fichiers sans référence, en lecture seule';

    public function handle(LearningFiles $files): int
    {
        $referenced = [];
        $missing = 0;
        $check = function (array $edition, string $context) use ($files, &$referenced, &$missing) {
            if (empty($edition['path'])) {
                return;
            }
            $disk = $edition['disk'] ?? 'local';
            $path = $edition['path'];
            if (in_array($disk, ['local', 'private'], true)) {
                $referenced[$path] = true;
            }
            if ($files->status($edition) !== 'available') {
                $missing++;
                $this->warn('Fichier absent ou stockage indisponible pour '.$context);
            }
        };
        AcademicResource::whereIn('kind', AcademicResource::CONTENT_KINDS)->whereNotNull('path')
            ->select(['id', 'disk', 'path'])->eachById(fn ($r) => $check($r->only(['disk', 'path']), 'ressource '.$r->id));
        ResourceVersion::select(['id', 'academic_resource_id', 'number', 'snapshot'])
            ->eachById(fn ($v) => $check($v->snapshot, 'ressource '.$v->academic_resource_id.' version '.$v->number));
        $orphans = 0;
        foreach (Storage::disk('local')->allFiles('learning-content') as $path) {
            if (! isset($referenced[$path])) {
                $orphans++;
                $this->line('Candidat orphelin '.$path);
            }
        }
        $this->info("$missing référence(s) indisponible(s), $orphans candidat(s) orphelin(s).");

        return self::SUCCESS;
    }
}
