# Validation et contrat Results

L’administration habilitée valide un lot clôturé lorsque tous les dossiers attendus ont une correction finalisée ou déjà validée. Une absence, une non-remise ou une dispense peut être finalisée avec une note absente. La transaction verrouille la validation, conserve sa révision et crée une enveloppe immuable par participant nouvellement validé.

Le flux JSON privé `GET /dashboard/admin/assessments/handoff?after=0` retourne au plus 100 enveloppes de la faculté autorisée, ordonnées par identifiant croissant. L’enveloppe contient `id` et `payload`. Le curseur `after` est le dernier identifiant traité. Les validations qui produisent ces identifiants sont sérialisées dans l’ordre de validation des transactions.

| Champ | Sémantique |
| --- | --- |
| `schema_version` | Version du contrat, actuellement 1 |
| `result_key`, `revision` | Identité stable du participant évalué et révision croissante |
| `student_profile_id`, `academic_enrollment_id`, `academic_course_registration_id` | Étudiant et dossier. L’inscription pédagogique peut être vide pour une offre historique. |
| `academic_assessment_id`, `academic_resource_id`, `academic_offering_id`, `course_id` | Activité, ressource et enseignement source |
| `curriculum_item_id`, `curriculum_unit_id`, `curriculum_version_id` | Références versionnées lorsqu’elles existent |
| `academic_year_id`, `academic_semester_id`, `academic_session_id`, `session_code` | Période, créneau et code de session |
| `participation`, `correction_state`, `category` | Situation, état de correction validée et type |
| `points_hundredths`, `maximum_points_hundredths`, `weight_percent` | Entiers en centièmes et pondération indicative. Les champs peuvent être vides. |
| `group_id`, `submission_id`, `submission_version` | Source du travail individuel ou collectif, si applicable |
| `validator_id`, `validated_at` | Autorité et instant de validation UTC |

Le consommateur conserve un curseur par périmètre et déduplique par couple `result_key` et `revision`. Une révision supérieure ouvre une mise à jour contrôlée, conformément aux règles de publication officielle. Les absences restent distinctes des zéros. Les nouvelles sessions ont leurs propres clés. Aucune copie ni appréciation privée ne figure dans le flux. L’accusé de traitement et l’écriture des notes officielles relèvent du futur consommateur.
