<?php

namespace Database\Seeders;

use App\Models\AdmissionCondition;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetail;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LandingLevelsSeeder extends Seeder
{
    public function run(): void
    {
        $faculties = [
            'MED' => 'medicine.jpg', 'SP' => 'students.jpg', 'SSPA' => 'academic.jpg',
            'DR' => 'ceremony.jpg', 'THEO' => 'campus.jpg',
        ];
        foreach ($faculties as $code => $image) {
            if (! Faculty::where('code', $code)->exists()) {
                throw new \RuntimeException("Faculté {$code} absente : importez d’abord les facultés de la landing.");
            }
            if (! is_file(public_path('assets/usk/'.$image))) {
                throw new \RuntimeException("Image de la faculté {$code} introuvable.");
            }
        }

        // General dossier only, from the published USK admissions flyer 2026–2027.
        // These documents do not establish eligibility for L2/L3 or a faculty-specific curriculum.
        $conditions = [
            ['Demande d’inscription', 'Une lettre précisant l’année d’entrée et la faculté choisie.', 'personal_info', true],
            ['Diplôme ou attestation de réussite', 'Quatre copies du diplôme d’État ou d’un titre reconnu équivalent. Pour les nouveaux diplômés, présenter l’attestation ou le relevé accepté par le service des admissions.', 'academic_info', true],
            ['Bulletins du secondaire', 'Une copie des bulletins des deux dernières années du secondaire (3e et 4e des humanités sur le flyer).', 'academic_info', true],
            ['Actes et attestations', 'Deux exemplaires de l’attestation de naissance et du certificat de bonne vie et mœurs.', 'personal_info', true],
            ['Engagement de prise en charge', 'Une lettre signée par la personne prenant en charge les études et attestant de ressources suffisantes.', 'personal_info', true],
            ['Photos d’identité', 'Quatre photos au format passeport.', 'personal_info', true],
            ['Formulaire complété', 'Formulaire d’inscription à obtenir au bureau des inscriptions et à compléter soigneusement.', 'other', true],
            ['Farde préimprimée USK', 'Farde préimprimée à obtenir sur le campus. Vérifier le tarif applicable auprès du service des admissions.', 'other', true],
            ['Documents du parcours antérieur', 'Relevés de résultats et attestations de fréquentation, selon la situation du candidat. Les équivalences et l’accès à un niveau supérieur sont à confirmer avec le service des admissions.', 'academic_info', false],
        ];

        DB::transaction(function () use ($faculties, $conditions) {
            foreach ($faculties as $code => $image) {
                $faculty = Faculty::where('code', $code)->firstOrFail();
                $path = 'levels/landing-'.strtolower($code).'.jpg';
                if (! Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->put($path, file_get_contents(public_path('assets/usk/'.$image)));
                }
                for ($year = 1; $year <= 3; $year++) {
                    $level = Level::firstOrCreate(['faculty_id' => $faculty->id, 'code' => 'L'.$year], [
                        'title' => 'Licence '.$year.' — '.$faculty->name,
                        'description' => 'Niveau préparatoire à valider par l’administration : L'.$year.' de la faculté '.$faculty->name.'. Le cursus et les modalités d’accès restent à confirmer avant activation.',
                        'tag' => 'À valider', 'image' => $path, 'is_active' => false,
                    ]);
                    // Preserve existing names, status, covers and details; only complete absent assets.
                    if (! $level->image) {
                        $level->update(['image' => $path]);
                    }
                    $detail = LevelDetail::firstOrCreate(['level_id' => $level->id], [
                        'duration_years' => 1, 'illustration_image' => $path,
                        'course_objective' => 'Objectifs pédagogiques à préciser et à valider par la faculté avant activation du niveau.',
                        'options' => [],
                    ]);
                    if (! $detail->illustration_image) {
                        $detail->update(['illustration_image' => $path]);
                    }
                    foreach ($conditions as [$title, $description, $section, $required]) {
                        AdmissionCondition::firstOrCreate([
                            'faculty_id' => $faculty->id, 'level_id' => $level->id, 'title' => $title,
                        ], ['description' => $description, 'section' => $section, 'is_required' => $required]);
                    }
                }
            }
        });
    }
}
