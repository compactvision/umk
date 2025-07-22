<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FacultyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'duration_years' => $this->duration_years,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),

            // Ajoutez des champs calculés si nécessaire
            'status_label' => $this->is_active ? 'Active' : 'Inactive',
            'duration_label' => $this->duration_years . ' an' . ($this->duration_years > 1 ? 's' : ''),

            // Relations si vous en avez
            // 'students_count' => $this->whenLoaded('students', fn() => $this->students->count()),
        ];
    }
}
