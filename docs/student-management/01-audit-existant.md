# Audit réel — phase 04

Audit du 7 novembre 2026, sur un arbre de travail contenant déjà de nombreuses modifications non committées. Ces modifications ont été conservées. Aucun commit, push ou déploiement.

| Domaine | État à l’arrivée | Preuve dans le dépôt | Intervention |
|---|---|---|---|
| Admission et matricule | Opérationnel | SubmitEnrollmentUseCase, StudentAdmissionService, tests StudentAcademicJourneyTest et AdmissionConsolidationTest | Conservation, aucun nouveau matricule |
| Compte et profil permanent | Opérationnel | User, StudentProfile, StudentProfileController | Réutilisation, état email et actions auditées |
| Inscription annuelle | Opérationnel | AcademicEnrollment, AcademicProgressionService | Conservation ; consolidation en phase 05 |
| Répertoire administratif | Partiel | AcademicAdministrationController::index, studentAcademic/Index.tsx | Recherche postnom/matricule permanent, programme, année/statut accessibles, contexte récent par étudiant |
| Dossier 360° | Partiel | StudentDossierService et studentAcademic/Show.tsx déjà présents | Lecture par onglet, pagination, demandes, compte, carte, maquette historique |
| Finance | Opérationnel | StudentFinanceService, obligations, paiements, ajustements | Lecture autorisée via le service propriétaire |
| Cours, présences, résultats | Opérationnel | AcademicAccessService, AcademicUnitResult, AcademicResource | Réutilisation, listes ciblées |
| Documents privés | Partiel | DocumentController, EnrollmentManagementController, stockage local | Protection supplémentaire du preview candidat ; téléchargement administratif nominatif |
| Demandes et réclamations | Opérationnel hors dossier | ServiceRequest, AcademicAdministrationController::respond | Intégration paginée dans le dossier |
| Cartes | Opérationnel dans un module spécialisé | CardEligibility, CardRequest, CardIssuance, tests CardRequestTest | Résumé des prérequis et état existant ; aucun moteur recréé |
| Suspension numérique distincte | Absente | Pas de champ de suspension numérique sur users | Non inventée à partir de student_status |
| Émission des diplômes | Absente | Aucun service d’émission identifié | Aucun écran prétendant l’émettre |
| Capacité à 5 000 utilisateurs simultanés | Non vérifiable | Aucun essai représentatif de cette charge | Scénarios préparés, aucune capacité certifiée |

Baseline exécutée avant modification : **269 réussis, 3 échecs**, 151 816 assertions. Voir `evidence/baseline.txt`. Les échecs provenaient du chargement ambigu `academicEnrollment:id,application_id` avec `oldestOfMany`; les colonnes ont été qualifiées. Le dossier et le répertoire n’ont pas été reconstruits.
