<?php

namespace App\Modules\Enrollment\Application\DTO;


final class DecisionDTO
{
    public function __construct(
        public readonly int $enrollmentId,
        public readonly string $decision, // validated|rejected|pending_documents
        public readonly ?string $notes = null,
        public readonly ?array $requirements = null, // [ {code,message,deadline_at?} ]
        public readonly int $actorId,
    ) {}
}
