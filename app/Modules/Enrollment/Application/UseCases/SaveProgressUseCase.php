<?php
// app/Modules/Enrollment/Application/UseCases/SaveProgressUseCase.php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Modules\Enrollment\Application\DTOs\SaveProgressDTO;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use Carbon\Carbon;

class SaveProgressUseCase
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $repository
    ) {}

    public function execute(SaveProgressDTO $dto): Enrollment
    {
        // Chercher un brouillon existant
        $enrollment = $dto->uuid 
            ? $this->repository->findByUuid($dto->uuid)
            : $this->repository->findDraftForStudent($dto->studentId);


        if (!$enrollment) {
            // Créer un nouveau brouillon
            $enrollment = new Enrollment([
                'student_id' => $dto->studentId,
                'level_id' => $dto->formSnapshot['level_id'],
                'academic_year_id' => $dto->formSnapshot['year_id'],
                'status' => EnrollmentStatus::DRAFT->value,
                'last_step' => $dto->lastStep,
                'form_snapshot' => $dto->formSnapshot,
                'draft_expires_at' => Carbon::now()->addDays(30),
            ]);
        } else {
            // Mettre à jour le brouillon existant
            $enrollment->last_step = max($enrollment->last_step, $dto->lastStep);
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

        return $this->repository->save($enrollment);
    }
}