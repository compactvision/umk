<?php

namespace App\Modules\Enrollment\Application\UseCases;


use App\Modules\Enrollment\Application\DTO\UploadDocumentDTO;
use App\Modules\Enrollment\Domain\Repositories\{EnrollmentRepository, EnrollmentDocumentRepository};
use App\Modules\Enrollment\Domain\Services\CoffreFortStorage;
use Illuminate\Support\Facades\DB;


final class UploadDocument
{
    public function __construct(
        private EnrollmentRepository $enrRepo,
        private EnrollmentDocumentRepository $docRepo,
        private CoffreFortStorage $storage,
    ) {}


    public function handle(UploadDocumentDTO $dto)
    {
        return DB::transaction(function () use ($dto) {
            $enrollment = $this->enrRepo->findById($dto->enrollmentId);
            $stored = $this->storage->store($enrollment->id, $dto->file);


            // calcul sha256 si pas fait par storage
            $sha256 = $stored['sha256'] ?? hash_file('sha256', $dto->file->getRealPath());


            return $this->docRepo->create([
                'enrollment_id' => $enrollment->id,
                'type' => $dto->type,
                'disk' => $stored['disk'],
                'path' => $stored['path'],
                'filename' => $dto->file->getClientOriginalName(),
                'mime' => $dto->file->getMimeType(),
                'size_bytes' => $dto->file->getSize(),
                'sha256' => $sha256,
                'verified' => false,
                'version' => 1,
            ]);
        });
    }
}
