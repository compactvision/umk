<?php

namespace App\Modules\AdmissionCondition\Application\DTOs;

use App\Modules\AdmissionCondition\Domain\Entities\AdmissionCondition;

class AdmissionConditionDTO
{
    public static function fromEntity(AdmissionCondition $entity): array
    {
        return [
            'id'          => $entity->getId(),
            'faculty_id'  => $entity->getFacultyId(),
            'level_id'    => $entity->getLevelId(),
            'title'       => $entity->getTitle(),
            'description' => $entity->getDescription(),
            'section'     => $entity->getSection(),
            'is_required' => $entity->isRequired(),
        ];
    }
}
