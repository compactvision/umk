<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\FacultyResource;
use App\Http\Resources\LevelResource;

class ProfessorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'first_name'    => $this->first_name,
            'last_name'     => $this->last_name,
            'full_name'     => $this->first_name . ' ' . $this->last_name,
            'email'         => $this->email,
            'phone'         => $this->phone,
            'gender'        => $this->gender,
            'birth_date'    => $this->birth_date,
            'photo'         => $this->photo,
            'speciality'    => $this->speciality,
            'biography'     => $this->biography,
            'hire_date'     => $this->hire_date,
            'is_active'     => $this->is_active,
            'status_label'  => $this->is_active ? 'Actif' : 'Inactif',

            // Dates formatées
            'created_at'    => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'    => $this->updated_at?->format('Y-m-d H:i:s'),

            // Relations
            'faculty'       => new FacultyResource($this->whenLoaded('faculty')),
            'level'         => new LevelResource($this->whenLoaded('level')),
            // 'courses'       => CourseResource::collection($this->whenLoaded('courses')),
        ];
    }
}
