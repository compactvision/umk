<?php

namespace Database\Seeders;

use App\Models\Professor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoProfessorsSeeder extends Seeder
{
    public function run(): void
    {
        // Fictional demonstration profiles. No affiliation with real professors is claimed.
        // Reserved .test addresses prevent the use of real contact information.
        $profiles = [
            ['Jean-Pierre', 'Kabeya Mukendi', 'jean-pierre.kabeya', 'Anatomie humaine et histologie', 'Médecine'],
            ['Marie-Claire', 'Ilunga Kasongo', 'marie-claire.ilunga', 'Physiologie et biochimie médicales', 'Médecine'],
            ['Patrick', 'Mbuyi Tshibangu', 'patrick.mbuyi', 'Microbiologie et immunologie', 'Médecine'],
            ['Grâce', 'Lukusa Mpoyi', 'grace.lukusa', 'Sémiologie et pharmacologie', 'Médecine'],
            ['André', 'Kanku Mutombo', 'andre.kanku', 'Épidémiologie et biostatistique', 'Santé publique'],
            ['Chantal', 'Mbala Nsimba', 'chantal.mbala', 'Santé communautaire et promotion de la santé', 'Santé publique'],
            ['Olivier', 'Kikunda Mulumba', 'olivier.kikunda', 'Santé environnementale et assainissement', 'Santé publique'],
            ['Esther', 'Nzuzi Makiese', 'esther.nzuzi', 'Politiques et management des systèmes de santé', 'Santé publique'],
            ['Joseph', 'Lutete Mavungu', 'joseph.lutete', 'Sociologie et méthodes de recherche', 'Sciences sociales, politiques et administratives'],
            ['Béatrice', 'Kabasele Tshimanga', 'beatrice.kabasele', 'Science politique et gouvernance', 'Sciences sociales, politiques et administratives'],
            ['Emmanuel', 'Bolamba Lokondo', 'emmanuel.bolamba', 'Administration publique et décentralisation', 'Sciences sociales, politiques et administratives'],
            ['Nadine', 'Moke Bokolo', 'nadine.moke', 'Relations internationales et développement', 'Sciences sociales, politiques et administratives'],
            ['François', 'Mukeba Kalala', 'francois.mukeba', 'Droit civil et droit des obligations', 'Droit'],
            ['Anne', 'Mbemba Kintoko', 'anne.mbemba', 'Droit constitutionnel et droit administratif', 'Droit'],
            ['David', 'Tshilombo Banza', 'david.tshilombo', 'Droit pénal et procédure pénale', 'Droit'],
            ['Rose', 'Kambale Muhindo', 'rose.kambale', 'Droit des affaires et droit OHADA', 'Droit'],
            ['Samuel', 'Nsakala Lufungula', 'samuel.nsakala', 'Études bibliques et exégèse', 'Théologie'],
            ['Élisabeth', 'Nkulu Kitambala', 'elisabeth.nkulu', 'Théologie systématique et éthique chrétienne', 'Théologie'],
            ['Paul', 'Mavinga Kiala', 'paul.mavinga', 'Histoire du christianisme et théologie africaine', 'Théologie'],
            ['Judith', 'Bisimwa Ngalula', 'judith.bisimwa', 'Théologie pratique et accompagnement pastoral', 'Théologie'],
        ];

        DB::transaction(function () use ($profiles) {
            foreach ($profiles as [$firstName, $lastName, $slug, $speciality, $faculty]) {
                $email = $slug.'@enseignants.example.test';
                // Preserve any profile subsequently edited by the administration.
                if (Professor::where('email', $email)->orWhere(fn ($q) => $q->where('first_name', $firstName)->where('last_name', $lastName))->exists()) continue;
                Professor::create([
                    'first_name' => $firstName, 'last_name' => $lastName, 'email' => $email,
                    'speciality' => $speciality, 'is_active' => true,
                    'biography' => "Profil fictif de démonstration — {$faculty}. Spécialité proposée : {$speciality}. Identité et coordonnées à remplacer par celles d’un enseignant réel.",
                ]);
            }
        });
    }
}
