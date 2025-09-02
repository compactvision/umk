<?php

namespace App\Modules\Admissions\Domain\ValueObjects;

final class StudentNumber
{
    public function __construct(
        public readonly string $number,
    ) {}
}
