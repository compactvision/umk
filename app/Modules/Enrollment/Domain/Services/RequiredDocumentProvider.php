<?php

namespace App\Modules\Enrollment\Domain\Services;


interface RequiredDocumentProvider
{
    /** Ex: ['diplome','releve_notes','id_card','photo'] */
    public function listForLevel(int $levelId): array;
}
