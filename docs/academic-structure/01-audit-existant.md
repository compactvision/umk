# Audit ciblé — phase 02

Date : 4 novembre 2026. La phase 01 est clôturée localement ; voir docs/architecture et ses preuves. Aucun serveur de production ni base existante modifié. Les migrations de phase 02 ne seront exécutées que dans les bases jetables de test.

| Concept | Modèle/table observé | État et dépendances | Décision minimale |
|---|---|---|---|
| Université | Site / sites : nom de site, adresse, contacts, logos | Identité éditoriale ; aucune relation propriétaire institutionnelle observée | Ajouter identité institutionnelle ; réutiliser Site pour contacts/médias, pas de second stockage de ces champs |
| Campus | Aucun modèle de campus identifié ; academic_sessions.room est une chaîne | Pas de données bâtiments/salles structurées | Documenter ; pas de campus fictif ni de refonte des salles |
| Faculté | Faculty / faculties | Niveaux, conditions, cours via niveaux ; codes globaux uniques | Conserver IDs/routes ; lien institutionnel nullable, rattachement administratif explicite |
| Département | Aucun modèle/table identifié | Pas de propriétaire département explicite | Ajouter sous faculté, statut/désactivation, pas de suppression de données utilisées |
| Programme | Formation représentée partiellement par Level + Faculty ; pas de programme regroupant les étapes | Le niveau reste la cible des admissions, cours et tarifs | Ajouter un regroupement de niveaux existants, sans dupliquer ni remplacer ces niveaux |
| Cycle | LevelCode / level_codes est un référentiel de codes de niveau, pas un cycle | Pas de durée/progression/périodes de cycle | Ajouter cycles configurables ; conserver LevelCode et ses usages |
| Niveau | Level / levels et LevelDetail | Code unique par faculté, tarifs, cours ; catalogue public de formations | Conserver ; rattachement programme–niveaux par pivot explicite, sans changer les identifiants |
| Promotion/groupe | Classes / classes : faculty_id, level_id, intake_id, status ; Intake / intakes : nom/dates | Groupe pédagogique et créneau d’entrée ; aucune preuve que Intake représente une cohorte de programme | Conserver Classes/Intake ; distinguer promotion programme/niveau/année et cohorte d’admission |
| Année | AcademicYear / academic_years | Admissions, inscriptions, offres et finances ; ouverture unique actuelle | Préserver workflows et historique ; aucun réenrôlement automatique |
| Semestre | AcademicSemester / academic_semesters ; number, dates, unicité année/number | SemesterService valide actuellement 1/2 ; Courses.semester et AcademicOffering.semester | Préserver planification ; périodes de maquette configurables indépendamment, ne pas modifier les séances existantes |
| Maquette | Courses / courses (catalogue vivant) ; AcademicOffering / academic_offerings (ouverture annuelle/enseignant) | Séances/ressources/présences/dépôts pointent vers offre ; pas de snapshot/version de programme | Ajouter versions et éléments de référence immuables conservant source_course_id |

## Preuves et lacunes

`bootstrap/providers.php`, `routes/web.php` et les providers Site/Newsletter ont été examinés en phase 01. Les Form Requests Faculty, contrôleur LevelDetail, CourseCatalog, SemesterService et pages facultés/niveaux/années ont été relus pour cette phase. Les modèles Faculty/Level/Courses/AcademicYear/Classes/Intake/Site et Student AcademicOffering/AcademicSemester confirment la matrice ci-dessus.

CourseCatalog modifie le catalogue courant sous verrou du niveau ; les lectures étudiantes utilisent encore ces valeurs vivantes. C’est la principale lacune historique : un nouveau programme ne doit pas modifier un ancien cursus. La correction doit utiliser les snapshots uniquement pour les inscriptions explicitement rattachées, et laisser les dossiers historiques non résolus dans leur état actuel.

La relation LevelCode::levels ne prouve pas l’existence d’un lien cycle : la migration levels utilise un code et le catalogue reste organisé par faculté/niveau. Créer un second catalogue de cours serait une erreur ; les snapshots référenceront les IDs existants. `Classes::withRemaining` contient une comparaison SQL avec guillemets doubles autour d’un statut historique ; aucun appel actif identifié pendant l’audit, à traiter séparément de la modélisation des promotions.

## Plan avant implémentation

1. Référentiel institutionnel et académique additif, liens existants nullable, aucun rattachement ambigu automatique.
2. Programme regroupant des niveaux ; cycle/périodes/pondération configurables ; départements et promotions distincts des groupes existants.
3. Maquette brouillon → validée → publiée → remplacée/archivée, version optimiste et publication sérialisée par programme.
4. Contenu publié immuable, cours et libellés/crédits/heures snapshotés ; nouvelle version par clonage.
5. Rattachement explicite, idempotent et audité d’une inscription à une seule version compatible ; résolution des nouvelles admissions uniquement si non ambiguë.
6. Interface administrative dédiée dans le layout actuel, comparaison et étudiants concernés ; refus serveur pour acteurs non autorisés.
7. Tests SQLite/PostgreSQL et non-régression, documentation des frontières et de l’ERD réel.

La configuration institutionnelle ne déduit pas un nom officiel d’une marque sans confirmation. Les données historiques sans maquette restent identifiées comme non rattachées ; elles ne seront pas artificiellement affectées à une version récente.
