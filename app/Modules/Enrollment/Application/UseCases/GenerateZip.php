<?php

namespace App\Modules\Enrollment\Application\UseCases;


use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepository;
use ZipArchive;


final class GenerateZip
{
    public function __construct(private EnrollmentRepository $repo) {}


    public function handle(int $enrollmentId): string
    {
        $enr = $this->repo->findById($enrollmentId);
        $zipPath = storage_path("app/private/enrollments/{$enr->id}/dossier_{$enr->uuid}.zip");
        @mkdir(dirname($zipPath), 0775, true);
        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach ($enr->documents as $doc) {
            $zip->addFile(storage_path("app/{$doc->disk}/{$doc->path}"), $doc->type . '_' . $doc->filename);
        }
        // TODO: ajouter JSON métadonnées + reçu PDF
        $zip->close();
        return $zipPath;
    }
}
