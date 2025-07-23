<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LevelResource extends JsonResource
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
            'faculty_id' => $this->faculty_id,
            'level_code' => $this->level_code,
            'level_name' => $this->level_name,
            'description' => $this->description,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'image' => $this->image,

            // Ajoutez des champs calculés si nécessaire

            // Relations si vous en avez
            // 'students_count' => $this->whenLoaded('students', fn() => $this->students->count()),
        ];
    }
}
