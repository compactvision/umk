<?php

namespace App\Modules\AdmissionCondition\Application\DTOs;

final class RequirementsPayload
{
    /** @param array<string,mixed> $data */
    public function __construct(public array $data) {}

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return $this->data;
    }
}