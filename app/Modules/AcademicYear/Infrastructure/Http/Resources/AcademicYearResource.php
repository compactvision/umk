<?php

// app/Modules/AcademicYear/Infrastructure/Http/Resources/AcademicYearResource.php
namespace App\Modules\AcademicYear\Infrastructure\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AcademicYearResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id(),
            'title' => $this->title(),
            'start_date' => $this->startDate()->format('Y-m-d'),
            'end_date' => $this->endDate()->format('Y-m-d'),
            'status' => $this->status(),
            'created_at' => $this->createdAt()?->format('Y-m-d'),
        ];
    }
}
