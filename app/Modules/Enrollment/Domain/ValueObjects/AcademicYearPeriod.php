<?php
// app/Modules/Enrollment/Domain/ValueObjects/AcademicYearPeriod.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use DateTimeImmutable;
use InvalidArgumentException;

final readonly class AcademicYearPeriod
{
    private function __construct(
        private DateTimeImmutable $startDate,
        private DateTimeImmutable $endDate
    ) {
        if ($startDate >= $endDate) {
            throw new InvalidArgumentException(
                "La date de fin doit être postérieure à la date de début"
            );
        }
    }

    public static function fromDates(DateTimeImmutable $start, DateTimeImmutable $end): self
    {
        return new self($start, $end);
    }

    public static function fromStrings(string $start, string $end): self
    {
        return new self(
            new DateTimeImmutable($start),
            new DateTimeImmutable($end)
        );
    }

    public function getStartDate(): DateTimeImmutable
    {
        return $this->startDate;
    }

    public function getEndDate(): DateTimeImmutable
    {
        return $this->endDate;
    }

    public function contains(DateTimeImmutable $date): bool
    {
        return $date >= $this->startDate && $date <= $this->endDate;
    }

    public function isCurrent(): bool
    {
        return $this->contains(new DateTimeImmutable());
    }

    public function overlaps(self $other): bool
    {
        return $this->startDate <= $other->endDate && $other->startDate <= $this->endDate;
    }

    public function getDurationInDays(): int
    {
        return $this->startDate->diff($this->endDate)->days;
    }

    public function format(): string
    {
        return sprintf(
            '%s - %s',
            $this->startDate->format('d/m/Y'),
            $this->endDate->format('d/m/Y')
        );
    }

    public function __toString(): string
    {
        return $this->format();
    }
}