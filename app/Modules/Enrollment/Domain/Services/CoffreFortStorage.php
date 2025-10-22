<?php

namespace App\Modules\Enrollment\Domain\Services;


use Illuminate\Http\UploadedFile;


interface CoffreFortStorage
{
    /** Retourne [disk, path, sha256, size, mime] */
    public function store(int $enrollmentId, UploadedFile $file, ?string $forceExt = null): array;
    /** Retourne contenu binaire/stream sécurisé (ou URL signée) */
    public function download(string $disk, string $path);
}
