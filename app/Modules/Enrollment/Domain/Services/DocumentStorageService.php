<?php

namespace App\Modules\Enrollment\Domain\Services;

use App\Models\EnrollmentDocument;
use App\Modules\Enrollment\Domain\Exceptions\DocumentException;
use App\Modules\Enrollment\Domain\ValueObjects\DocumentHash;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentStorageService
{
    private const DISK = 'private';
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    public function store(UploadedFile $file, int $enrollmentId, string $key): array
    {
        // Validation
        $this->validateFile($file);
        
        // Générer un chemin unique
        $uuid = Str::uuid();
        $extension = $file->getClientOriginalExtension();
        $year = date('Y');
        $path = "enrollments/{$year}/{$enrollmentId}/{$uuid}.{$extension}";
        
        // Stocker le fichier
        $storedPath = Storage::disk(self::DISK)->putFileAs(
            dirname($path),
            $file,
            basename($path)
        );
        
        if (!$storedPath) {
            throw DocumentException::uploadFailed("Échec du stockage du fichier");
        }
        
        // Calculer le hash
        $hash = DocumentHash::fromFile($file->getRealPath());
        
        return [
            'uuid' => $uuid,
            'path' => $storedPath,
            'filename' => $file->getClientOriginalName(),
            'mime' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'sha256' => $hash->toString(),
            'disk' => self::DISK,
            'key' => $key,
        ];
    }
    
    public function delete(EnrollmentDocument $document): bool
    {
        return Storage::disk($document->disk)->delete($document->path);
    }
    
    private function validateFile(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw DocumentException::invalidFile("Fichier corrompu");
        }
        
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw DocumentException::invalidFile("Fichier trop volumineux (max 10MB)");
        }
        
        $allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw DocumentException::invalidFile("Type de fichier non autorisé");
        }
    }
}