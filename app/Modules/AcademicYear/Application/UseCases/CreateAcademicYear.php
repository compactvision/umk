<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Modules\AcademicYear\Domain\Entities\AcademicYear;
use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use DateTimeImmutable;
use DomainException;

final class CreateAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(string $title, string $start, string $end): AcademicYear
    {
        if ($start >= $end) {
            throw new DomainException("La date de fin doit être postérieure à la date de début.");
        }

        $entity = AcademicYear::create(
            $title,
            new DateTimeImmutable($start),
            new DateTimeImmutable($end)
        );

        return $this->repo->save($entity);
    }
}
