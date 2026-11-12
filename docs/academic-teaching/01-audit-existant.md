# Audit pédagogique — 10 novembre 2026

Audit effectué sur le dépôt avant modification. La commande `php artisan test` a réussi **310 tests et 152 531 assertions** en 62,87 s. [Sortie de la baseline](evidence/baseline.txt). Base de test SQLite en mémoire ; aucune opération sur la base universitaire.

| Périmètre | État constaté avant la phase | Risque ou traitement |
|---|---|---|
| Catalogue `Courses`, `CourseCatalog`, `LevelDetailController` | Création, modification par niveau, recherche et plafond de crédits | Pas de cycle de vie ni d’unicité métier des codes ; ajout sans recodification historique |
| `CurriculumVersion`, `CurriculumUnit`, `CurriculumItem` | Maquettes annuelles ou de cohorte, instantanés, révision, revue par niveau, validation/publication, copie et immutabilité | EC obligatoires/optionnels non distingués ; contrôle des crédits UE incomplet pour une règle indépendante |
| `AcademicOffering` | Offre annuelle par matière, niveau, groupe/département ; semestre indicatif et publication | L’offre ne désignait pas l’EC exact ; risque de partager une offre entre versions du même cours |
| `Professor`, `TeachingAssignmentService` | Annuaire, activation, responsable et assistant ; pivots historiques de rattachement au référentiel | Pointeurs courants sans périodes ni lien de connexion ; les pivots historiques ne sont pas un second registre d’offres |
| `AcademicEnrollment` / `CourseException` | Inscription annuelle et accès dérivé du niveau, groupe et exceptions | Pas de participation individuelle conservée pour une offre |
| `ScheduleService`, `AcademicSession`, `AcademicAttendance` | Séances et récurrences, conflits salle/public/enseignants, publication, appel | Période souvent lue sur le catalogue ; changement de responsable réaffichait son nom sur les anciennes séances |
| `AcademicResource`, `AcademicSubmission` | Supports privés, vidéos, liens, publications et dépôts versionnés | Les nouveaux rattachements devaient s’appliquer aux routes directes et pas seulement à la navigation |
| `AcademicUnitResult` et dossier 360° | Décisions existantes par UE ; affichage des résultats autorisés | Aucune base pour déduire une réussite d’EC ou une équivalence à partir de l’inscription |
| Espace enseignant | Rôle de compte et annuaire administratif présents | Aucun lien explicite compte–fiche ni vue privée de ses offres |
| Performance | Catalogue paginé, chargement des relations existant | Beaucoup de références chargées sur certaines anciennes pages ; pas de preuve de 5 000 connexions |

Vérification des phases : structure et publication testées (`AcademicStructureTest`), admissions liées au programme (`AdmissionConsolidationTest`), dossier permanent et mouvements annuels (`StudentManagementTest`, `EnrollmentManagementFollowupTest`), règles financières réelles (`UniversityFinanceTest`, `StudentAcademicJourneyTest`). Les routes et les seeders de démonstration `CompleteAcademicYearSeeder`, `CurrentYearTeachingAssignmentsSeeder` et `CoursePedagogySeeder` sont conservés. Les anciens pivots, séances, présences, travaux et résultats ne sont ni réinterprétés ni migrés par le nouveau schéma.
