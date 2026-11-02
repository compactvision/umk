<?php
// app/Modules/Enrollment/Application/UseCases/SaveProgressUseCase.php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Modules\Enrollment\Application\DTOs\SaveProgressDTO;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class SaveProgressUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $repository,
        private readonly DocumentRepositoryInterface $documentRepository
    ) {}

    public function execute(SaveProgressDTO $dto): Enrollment
    {
        // Chercher un brouillon existant UNIQUEMENT si un UUID est fourni
        $enrollment = $dto->uuid 
            ? $this->repository->findByUuid($dto->uuid)
            : null;


        if ($dto->uuid && !$enrollment) {
            throw \Illuminate\Validation\ValidationException::withMessages(['uuid' => 'Ce brouillon est introuvable.']);
        }

        if ($enrollment && ($enrollment->student_id !== $dto->studentId || $enrollment->status !== EnrollmentStatus::DRAFT)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'uuid' => 'Ce brouillon ne peut pas être modifié.'
            ]);
        }

        if (!$enrollment) {
            // Créer un nouveau brouillon
            $enrollment = new Enrollment([
                'student_id' => $dto->studentId,
                'level_id' => $dto->formSnapshot['level_id'] ?? null,
                'academic_year_id' => $dto->formSnapshot['year_id'] ?? null,
                'status' => EnrollmentStatus::DRAFT->value,
                'last_step' => $dto->lastStep,
                'form_snapshot' => $dto->formSnapshot,
                'draft_expires_at' => Carbon::now()->addDays(30),
            ]);
        } else {
            // Mettre à jour le brouillon existant
            $enrollment->last_step = $dto->lastStep;
            $enrollment->form_snapshot = array_merge(
                $enrollment->form_snapshot ?? [],
                $dto->formSnapshot
            );
            $enrollment->draft_expires_at = Carbon::now()->addDays(30);
            
            // Extraire les IDs depuis le snapshot si disponibles
            if (!empty($dto->formSnapshot['level_id'])) {
                $enrollment->level_id = $dto->formSnapshot['level_id'];
            }
            if (!empty($dto->formSnapshot['year_id'])) {
                $enrollment->academic_year_id = $dto->formSnapshot['year_id'];
            }
        }

        $snapshot = $enrollment->form_snapshot ?? [];
        unset($snapshot['cardNumber'], $snapshot['cvv']);
        $enrollment->form_snapshot = $snapshot;

        // Vérifier l'unicité avant de sauvegarder
        if ($enrollment->level_id && $enrollment->academic_year_id) {
            $exists = $this->repository->checkUniqueness(
                $enrollment->student_id,
                $enrollment->level_id,
                $enrollment->academic_year_id,
                $enrollment->id // Exclure l'inscription actuelle si elle existe déjà
            );

            if ($exists) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'uniqueness' => 'Vous avez déjà une inscription active pour ce niveau et cette année académique.'
                ]);
            }
        }

        // Sauvegarder d'abord pour avoir l'ID
        $enrollment = $this->repository->save($enrollment);

        // Traitement des documents temporaires
        $documents = $enrollment->form_snapshot['documents'] ?? [];
        $hasChanges = false;

        // Apply explicit removals from the submitted snapshot.
        foreach ($this->documentRepository->findByEnrollment($enrollment->id) as $existingDocument) {
            if (!array_key_exists($existingDocument->key, $documents)) {
                // Keep soft-deleted records from blocking a later upload for this key.
                $existingDocument->key = 'removed-' . $existingDocument->uuid;
                $this->documentRepository->save($existingDocument);
                $this->documentRepository->delete($existingDocument);
            }
        }

        foreach ($documents as $key => $docData) {
            if (isset($docData['temp'])) {
                $tempPath = $docData['temp']['path'];
                
                if (Storage::disk('temp')->exists($tempPath)) {
                    $oldDoc = $this->documentRepository->findByEnrollmentAndKey($enrollment->id, $key);
                    $contents = Storage::disk('temp')->get($tempPath);
                    $newPath = "enrollments/{$enrollment->uuid}/" . \Illuminate\Support\Str::uuid() . '/' . basename($docData['filename']);
                    Storage::disk('local')->put($newPath, $contents);
                    $oldPath = $oldDoc?->path;
                    $oldDisk = $oldDoc?->disk;
                    $document = $oldDoc ?? new \App\Models\EnrollmentDocument;
                    $document->fill([
                        'enrollment_id' => $enrollment->id,
                        'type' => 'document',
                        'disk' => 'local',
                        'path' => $newPath,
                        'filename' => $docData['filename'],
                        'mime' => $docData['mime'],
                        'size_bytes' => strlen($contents),
                        'sha256' => hash('sha256', $contents),
                        'key' => $key,
                        'is_temp' => true,
                    ]);
                    $doc = $this->documentRepository->save($document);
                    Storage::disk('temp')->delete($tempPath);
                    if ($oldPath && $oldDisk) Storage::disk($oldDisk)->delete($oldPath);

                    // Mettre à jour le snapshot avec les infos permanentes
                    $documents[$key] = [
                        'uuid' => $doc->uuid,
                        'filename' => $doc->filename,
                        'mime' => $doc->mime,
                        'size_bytes' => $doc->size_bytes,
                    ];
                    $hasChanges = true;
                }
            }
        }

        if ($hasChanges) {
            $snapshot = $enrollment->form_snapshot;
            $snapshot['documents'] = $documents;
            $enrollment->form_snapshot = $snapshot;
            $enrollment = $this->repository->save($enrollment);
        }

        return $enrollment;
    }
}