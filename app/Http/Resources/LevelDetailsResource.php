<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class LevelDetailsResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        // On suppose que illustration_image stocke un chemin (ex: 'levels/illust.jpg')
        $imageUrl = $this->illustration_image
            ? (Storage::disk(config('filesystems.default'))->url($this->illustration_image))
            : null;

        return [
            'id'                => $this->id,
            'level_id'          => $this->level_id,

            // Caractéristiques académiques / administratives
            'price'             => $this->price,            // Laisse brut pour l’UI (formatage côté front)
            'has_certificate'   => (bool) $this->has_certificate,
            'language'          => $this->language,
            'duration_years'    => $this->duration_years,
            'student_number'    => $this->student_number,
            'credit_required'    => $this->credit_required,
            'courses_number'     => $this->courses_number,

            // Médias
            'illustration_image'     => $this->illustration_image,      // chemin brut
            'illustration_image_url' => $imageUrl,                       // URL publique (si Storage configuré)

            // Contenu
            'course_objective'  => $this->course_objective,
            'fees'              => $this->fees,      // garde brut; si JSON, caste côté modèle
            'options'           => $this->options,   // array via $casts

            // Métadonnées
            'created_at'        => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'        => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
