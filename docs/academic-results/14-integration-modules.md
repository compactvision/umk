# Contrats avec les modules existants

| Module | Contrat |
| --- | --- |
| Assessments | Enveloppes version 1. Résultat validé lié au dossier, à l’inscription pédagogique, à l’EC et à la session. La révision doit correspondre à la correction validée courante. |
| Curricula et Teaching | Maquette publiée immuable, sources associées à leurs EC et inscriptions actives. Les crédits d’UE validés servent aux prérequis. |
| Enrollment | Une décision de progression cite `academic_official_result_id`. `same` exige le même niveau et `next` une destination autorisée par le parcours. `none` ferme le passage. Une décision ultérieure invalide l’autorisation de départ encore inutilisée jusqu’à confirmation administrative. Les réinscriptions suivent leur workflow existant. |
| Documents | `GET /dashboard/admin/academic-results/certified/{result}` fournit la version 1 du jeu de données certifiées, avec référence d’édition, date, inscription, décision, contexte et instantané public. Il exige la permission de publication et le périmètre facultaire. `ResultDocuments` assure l’émission locale dans cette phase. |
| Portail et dossier 360° | L’historique officiel complète les résultats personnels et manuels. La règle de consultation centrale protège les données étudiant. |

Les références du flux Documents identifient une édition et demeurent stables. Les sources internes de corrections, fichiers et motifs de recours sont exclus du contrat. Aucun événement de publication ne déclenche à lui seul une réinscription.
