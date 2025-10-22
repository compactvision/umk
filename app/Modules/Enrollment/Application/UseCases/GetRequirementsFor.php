<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\AdmissionCondition;
use App\Models\AcademicYear;
use App\Models\LevelDetail;
use Illuminate\Support\Str;

final class GetRequirementsFor
{
    /**
     * Retourne:
     * [
     *   'personal_info' => [ {key,label,required,mimes?,hint?}, ... ],
     *   'academic_info' => [ ... ],
     *   'payment' => ['required'=>bool,'amount'=>float,'currency'=>string]
     * ]
     */
    public function __invoke(int $levelId, int $yearId, ?int $facultyId = null): array
    {
        // 1) Garde-fou: année active (on bloque côté controller aussi)
        $yearIsActive = AcademicYear::where('id', $yearId)->where('status', 'open')->exists();
        if (!$yearIsActive) {
            // On laisse le controller renvoyer 422 ; ici on peut aussi lever une exception domaine si tu préfères.
        }

        // 2) Récupère les conditions par section pour ce niveau,
        //    avec fallback possible sur la faculté (conditions globales à la fac, sans level).
        $personal = $this->fetchSection($facultyId, $levelId, 'personal_info');
        $academic = $this->fetchSection($facultyId, $levelId, 'academic_info');

        // 3) Paiement: basé sur level_details (pas de is_paid dans ton schéma conditions)
        $detail = LevelDetail::where('level_id', $levelId)->first();
        $amount = (float)($detail->fees ?? 0);
        $currency = $detail->currency ?? 'USD';
        $isPaid = $amount > 0;

        return [
            'personal_info' => $personal,
            'academic_info' => $academic,
            'payment' => [
                'required' => $isPaid,
                'amount'   => $amount,
                'currency' => $currency,
            ],
        ];
    }

    /**
     * Construit la liste des conditions pour une section donnée.
     * Priorité:
     *  - conditions spécifiques au level
     *  - puis (si présent) conditions de la faculté sans level
     *  - puis (optionnel) conditions globales sans faculty/level
     */
    private function fetchSection(?int $facultyId, ?int $levelId, string $section): array
    {
        // a) Conditions spécifiques au niveau
        $byLevel = AdmissionCondition::query()
            ->where('section', $section)
            ->where('level_id', $levelId)
            ->orderBy('id')
            ->get(['title', 'description', 'is_required']);

        // b) Conditions de la faculté (sans level), si aucune spécifique au level
        $byFaculty = collect();
        if ($byLevel->isEmpty() && $facultyId) {
            $byFaculty = AdmissionCondition::query()
                ->where('section', $section)
                ->whereNull('level_id')
                ->where('faculty_id', $facultyId)
                ->orderBy('id')
                ->get(['title', 'description', 'is_required']);
        }

        // c) (Optionnel) Globales sans faculty/level si toujours vide
        $globals = collect();
        if ($byLevel->isEmpty() && $byFaculty->isEmpty()) {
            $globals = AdmissionCondition::query()
                ->where('section', $section)
                ->whereNull('level_id')
                ->whereNull('faculty_id')
                ->orderBy('id')
                ->get(['title', 'description', 'is_required']);
        }

        $items = $byLevel->isNotEmpty() ? $byLevel : ($byFaculty->isNotEmpty() ? $byFaculty : $globals);

        // Map → structure demandée par le front
        return $items->map(function ($c) {
            return [
                'key'      => Str::slug($c->title, '_'), // ex: "Copie du diplôme" -> "copie_du_diplome"
                'label'    => $c->title,
                'required' => (bool)$c->is_required,
                'mimes'    => $this->defaultMimes(),     // ton schéma n’a pas de mimes : on propose un défaut
                'hint'     => $c->description,           // optionnel pour affichage
            ];
        })->values()->all();
    }

    private function defaultMimes(): array
    {
        // Ajuste selon ta politique d’upload
        return ['application/pdf', 'image/jpeg', 'image/png'];
    }
}
