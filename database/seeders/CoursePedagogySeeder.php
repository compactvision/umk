<?php

namespace Database\Seeders;

use App\Models\Courses;
use App\Modules\Teaching\Application\Services\CourseWorkload;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CoursePedagogySeeder extends Seeder
{
    public function run(): void
    {
        $outlines = json_decode(file_get_contents(__DIR__.'/data/course-outlines.json'), true, flags: JSON_THROW_ON_ERROR);
        $methods = [
            'theory' => 'CMI : exposés structurés et lectures commentées. TD : analyse de textes et études de cas. TP : application guidée et restitution.',
            'applied' => 'CMI : présentation des concepts et des méthodes. TD : exercices progressifs, cas et problèmes. TP : réalisation d’un dossier ou d’une application contextualisée.',
            'lab' => 'CMI : bases scientifiques et principes des méthodes. TD : préparation et interprétation des exercices. TP : observations, simulations ou travaux de laboratoire encadrés, selon les moyens disponibles.',
            'clinical' => 'CMI : fondements et principes de la démarche étudiée. TD : discussion de cas et raisonnement structuré. TP : observation, simulation et activités encadrées ; aucun acte autonome n’est présumé autorisé.',
            'field' => 'CMI : préparation conceptuelle, consignes et cadre éthique. TD : préparation des outils et analyse des situations. TP : terrain ou stage sous supervision, carnet de bord et restitution.',
            'research' => 'CMI : repères théoriques et méthodologiques. TD : ateliers de problématisation, critique et rédaction. TP : recherche documentaire ou enquête autorisée, production d’un dossier et présentation.',
        ];
        $assessments = [
            'theory' => 'Questions de compréhension, analyse argumentée de documents et synthèse écrite.',
            'applied' => 'Exercices, études de cas et production d’un travail appliqué commenté.',
            'lab' => 'Préparation des travaux, comptes rendus, interprétation des observations et épreuve de synthèse.',
            'clinical' => 'Discussion de cas, grilles d’observation supervisée et synthèse réflexive.',
            'field' => 'Objectifs de stage, carnet de bord, appréciation de l’encadrement et rapport présenté oralement.',
            'research' => 'Qualité des sources, rigueur de la méthode, dossier écrit et présentation argumentée.',
        ];
        DB::transaction(function () use ($outlines, $methods, $assessments) {
            foreach (Courses::with('level.faculty')->orderBy('id')->lockForUpdate()->get() as $course) {
                $key = $course->level->faculty->code.':'.$course->level->code.':'.$course->title;
                if (!isset($outlines[$key])) throw new \RuntimeException("Plan pédagogique manquant pour le cours {$course->id} : {$course->title}.");
                $outline = $outlines[$key];
                $hours = app(CourseWorkload::class)->allocate((int) $course->credits, $outline['profile'], $course->only(['cmi_hours', 'td_hours', 'tp_hours']));
                $updates = [];
                foreach (['cmi_hours', 'td_hours', 'tp_hours'] as $field) {
                    if ($course->$field === null) $updates[$field] = $hours[$field];
                }
                if (!trim((string) $course->pedagogical_content)) {
                    $topics = $outline['topics'];
                    $plan = implode("\n", array_map(fn ($topic, $index) => ($index + 1).'. '.$topic.'.', $topics, array_keys($topics)));
                    $progression = match ($course->level->code) {
                        'L1' => 'Acquérir le vocabulaire, les concepts fondamentaux et les premières méthodes de la discipline.',
                        'L2' => 'Approfondir les méthodes, analyser des situations et justifier les choix à partir des connaissances acquises.',
                        default => 'Mobiliser les acquis dans des situations complexes, développer une analyse critique et produire un travail de synthèse.',
                    };
                    $updates['pedagogical_content'] = "PROPOSITION PÉDAGOGIQUE — à valider par la faculté\n\n"
                        ."{$course->title}\n{$course->level->title} · {$course->level->faculty->name}\n\n"
                        ."OBJECTIFS ET ACQUIS ATTENDUS\n{$progression}\n"
                        ."À l’issue du cours, l’étudiant sera capable d’expliquer les notions liées à « {$topics[0]} », d’analyser « {$topics[1]} » et de présenter un travail argumenté portant sur « {$topics[3]} ».\n\n"
                        ."CONTENU DU COURS\n{$plan}\n\n"
                        ."ORGANISATION DES APPRENTISSAGES\n{$methods[$outline['profile']]}\n\n"
                        ."CHARGE DE TRAVAIL PROPOSÉE\n{$course->credits} crédits × 25 h = {$hours['total_hours']} h de travail étudiant.\n"
                        ."Heures encadrées : {$hours['supervised_hours']} h, réparties en CMI {$hours['cmi_hours']} h, TD {$hours['td_hours']} h et TP {$hours['tp_hours']} h.\n"
                        ."Travail personnel estimé : {$hours['personal_hours']} h (lectures, préparation, exercices, révision et production des travaux). Les stages et activités de terrain sont comptabilisés dans les TP encadrés de cette proposition.\n\n"
                        ."ÉVALUATION PROPOSÉE\n{$assessments[$outline['profile']]} Les modalités, critères et pondérations seront précisés par l’équipe enseignante.\n\n"
                        ."RESSOURCES\nSupports et bibliographie à communiquer par le titulaire. Aucun support de cours ni ouvrage non disponible n’est présumé fourni.";
                }
                if ($updates) $course->forceFill($updates)->save();
            }
        });
    }
}
