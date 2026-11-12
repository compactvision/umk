# Audit initial

| Domaine | État vérifié | Code et dépendance | Action |
| --- | --- | --- | --- |
| Notes pédagogiques | Saisie, grille, correction, validation et révisions disponibles | `AssessmentCorrections`, `AssessmentRecord`, `AssessmentHandoff` | Consommer uniquement les corrections validées du dossier et leurs révisions |
| Notes et résultats manuels | Résultats personnels sous forme de ressources, fichiers privés et résultats d’UE saisis à la main | `AcademicResource`, `AcademicUnitResult`, portail, dossier 360° | Conserver les identifiants, fichiers et routes. Inventorier sans interpréter les PDF. |
| Maquettes et inscriptions | Versions publiées, UE, EC, crédits, coefficients et inscriptions pédagogiques | `CurriculumService`, `CourseRegistrationService` | Calculer dans la maquette et l’inscription applicables |
| Moyennes et crédits | Indicateurs simples sur les UE manuelles, sans moteur réglementaire | `StudentDossierService` | Ajouter le calcul exact et versionné |
| Jury et progression | Décision de passage et parcours de réinscription existants. Jury structuré absent. | `AcademicProgressionService` | Ajouter le jury et fournir une décision officielle référencée |
| Documents | Dépôts protégés et reçus imprimables. Aucun moteur général de documents académiques dans le dépôt. | `LearningFiles`, stockage local privé | Générer les documents de cette phase via une interface réutilisable |
| Recours | Demandes administratives et demandes de révision pédagogique | `ServiceRequest` | Spécialiser le traitement des contestations de résultats officiels |
| Accès | Rôles, périmètre facultaire et règles académiques de consultation | `TeachingScope`, `AcademicAccessService` | Réutiliser les contrôles et séparer les permissions métier |

La baseline PHP exécutée avant intervention est de 347 tests réussis et 153 378 assertions sur SQLite en mémoire. [Sortie initiale](evidence/baseline.txt)
