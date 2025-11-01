<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\EnrollmentDocument;
use App\Modules\Enrollment\Application\DTOs\UploadDocumentDTO;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use App\Modules\Enrollment\Domain\Services\DocumentStorageService;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use Illuminate\Support\Facades\DB;

class UploadDocumentUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $enrollmentRepository,
        private readonly DocumentRepositoryInterface $documentRepository,
        private readonly DocumentStorageService $storageService,
        private readonly SaveProgressUseCase $saveProgressUseCase,
    ) {}

    public function execute(UploadDocumentDTO $dto): EnrollmentDocument
    {
        return DB::transaction(function () use ($dto) {
            // Récupérer ou créer l'enrollment
            $enrollment = $dto->enrollmentUuid
                ? $this->enrollmentRepository->findByUuid($dto->enrollmentUuid)
                : $this->enrollmentRepository->findDraftForStudent($dto->studentId);

            if (!$enrollment) {
                // Créer un nouveau brouillon si nécessaire
                $enrollment = $this->saveProgressUseCase->execute(
                    new \App\Modules\Enrollment\Application\DTOs\SaveProgressDTO(
                        uuid: null,
                        studentId: $dto->studentId,
                        lastStep: 1,
                        formSnapshot: []
                    )
                );
            }

            // Stocker le fichier
            $fileData = $this->storageService->store(
                $dto->file,
                $enrollment->id,
                $dto->key
            );

            // Chercher un document existant avec cette clé
            $existingDoc = $this->documentRepository->findByEnrollmentAndKey(
                $enrollment->id,
                $dto->key
            );

            if ($existingDoc) {
                // Supprimer l'ancien fichier
                $this->storageService->delete($existingDoc);
                
                // Incrémenter la version
                $fileData['version'] = $existingDoc->version + 1;
                
                // Supprimer l'ancienne entrée
                $this->documentRepository->delete($existingDoc);
            }

            // Créer le nouveau document
            $document = new EnrollmentDocument([
                'enrollment_id' => $enrollment->id,
                'uuid' => $fileData['uuid'],
                'type' => $this->mapKeyToType($dto->key),
                'disk' => $fileData['disk'],
                'path' => $fileData['path'],
                'filename' => $fileData['filename'],
                'mime' => $fileData['mime'],
                'size_bytes' => $fileData['size_bytes'],
                'sha256' => $fileData['sha256'],
                'key' => $fileData['key'],
                'is_temp' => $enrollment->status === EnrollmentStatus::DRAFT->value,
                'version' => $fileData['version'] ?? 1,
            ]);

            return $this->documentRepository->save($document);
        });
    }

    private function mapKeyToType(string $key): string
    {
        $mapping = [
            'id_card' => 'id_card',
            'photo' => 'photo',
            'diploma' => 'diploma',
            'transcript' => 'transcript',
            'birth_certificate' => 'birth_certificate',
        ];

        return $mapping[$key] ?? 'other';
    }
}