<?php

// app/Modules/Enrollment/Application/UseCases/SaveProgressUseCase.php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\User;
use App\Modules\Enrollment\Application\DTOs\SaveProgressDTO;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SaveProgressUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $repository,
        private readonly DocumentRepositoryInterface $documentRepository
    ) {}

    public function execute(SaveProgressDTO $dto): Enrollment
    {
        $createdPaths = [];
        try {
            return DB::transaction(function () use ($dto, &$createdPaths) {
                User::whereKey($dto->studentId)->lockForUpdate()->firstOrFail();

                return $this->persist($dto, $createdPaths);
            });
        } catch (\Throwable $exception) {
            foreach ($createdPaths as $path) {
                Storage::disk('local')->delete($path);
            }
            throw $exception;
        }
    }

    private function persist(SaveProgressDTO $dto, array &$createdPaths): Enrollment
    {
        // Validate ownership before any database or storage mutation.
        foreach (($dto->formSnapshot['documents'] ?? []) as $document) {
            if (isset($document['temp'])) {
                $path = $document['temp']['path'] ?? null;
                $prefix = 'enrollments/tmp/'.$dto->studentId.'/';
                if (! is_string($path) || ! str_starts_with($path, $prefix) || str_contains($path, '..') || str_contains($path, '\\') || ! Storage::disk('temp')->exists($path)) {
                    throw ValidationException::withMessages(['documents' => 'Ce fichier temporaire est indisponible ou ne vous appartient pas. Téléversez-le à nouveau.']);
                }
            }
        }

        // Chercher un brouillon existant UNIQUEMENT si un UUID est fourni
        $enrollment = $dto->uuid
            ? Enrollment::where('uuid', $dto->uuid)->lockForUpdate()->first()
            : null;

        if (! $dto->uuid) {
            $enrollment = Enrollment::forStudent($dto->studentId)->drafts()
                ->where('level_id', $dto->formSnapshot['level_id'] ?? null)
                ->where('academic_year_id', $dto->formSnapshot['year_id'] ?? null)
                ->where(fn ($query) => $query->whereNull('draft_expires_at')->orWhere('draft_expires_at', '>', now()))
                ->latest('id')->lockForUpdate()->first();
        }

        if ($dto->uuid && ! $enrollment) {
            throw ValidationException::withMessages(['uuid' => 'Ce brouillon est introuvable.']);
        }

        if ($enrollment && ($enrollment->student_id !== $dto->studentId || $enrollment->status !== EnrollmentStatus::DRAFT)) {
            throw ValidationException::withMessages([
                'uuid' => 'Ce brouillon ne peut pas être modifié.',
            ]);
        }

        if ($enrollment?->isExpired()) {
            throw ValidationException::withMessages(['uuid' => 'Ce brouillon a expiré. Commencez un nouveau dossier.']);
        }

        if (! $enrollment) {
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
            if (! empty($dto->formSnapshot['level_id'])) {
                $enrollment->level_id = $dto->formSnapshot['level_id'];
            }
            if (! empty($dto->formSnapshot['year_id'])) {
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
                throw ValidationException::withMessages([
                    'uniqueness' => 'Vous avez déjà une inscription active pour ce niveau et cette année académique.',
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
            if (! array_key_exists($existingDocument->key, $documents)) {
                // Keep soft-deleted records from blocking a later upload for this key.
                $existingDocument->key = 'removed-'.$existingDocument->uuid;
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
                    $newPath = "enrollments/{$enrollment->uuid}/".Str::uuid().'/'.basename($docData['filename']);
                    if (! Storage::disk('local')->put($newPath, $contents)) {
                        throw new \RuntimeException('Stockage du justificatif impossible.');
                    }
                    $createdPaths[] = $newPath;
                    $oldPath = $oldDoc?->path;
                    $oldDisk = $oldDoc?->disk;
                    $document = $oldDoc ?? new EnrollmentDocument;
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
                    DB::afterCommit(function () use ($tempPath, $oldPath, $oldDisk) {
                        try {
                            Storage::disk('temp')->delete($tempPath);
                            if ($oldPath && $oldDisk) {
                                Storage::disk($oldDisk)->delete($oldPath);
                            }
                        } catch (\Throwable $exception) {
                            Log::warning('Document cleanup requires retry.');
                        }
                    });

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
