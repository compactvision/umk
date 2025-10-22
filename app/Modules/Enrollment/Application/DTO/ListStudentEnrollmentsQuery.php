<?php

namespace App\Modules\Enrollment\Application\DTO;

use DateTimeInterface;

final class ListStudentEnrollmentsQuery
{
    public function __construct(
        public readonly int $studentId,
        public readonly ?array $statuses = null,     // ex: ['draft','submitted', ...]
        public readonly ?int $levelId = null,
        public readonly ?DateTimeInterface $from = null,     // filtre created_at/enrolled_at >= from
        public readonly ?DateTimeInterface $to = null,       // filtre created_at/enrolled_at <= to
        public readonly ?string $search = null,      // recherche sur matricule/notes
        public readonly string $dateField = 'created_at',    // 'created_at' | 'enrolled_at'
        public readonly string $orderBy = 'created_at',
        public readonly string $orderDir = 'desc',   // asc|desc
        public readonly int $perPage = 15,
        public readonly int $page = 1,
    ) {}
}
