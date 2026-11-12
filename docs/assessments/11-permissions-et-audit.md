# Permissions et audit

| Rôle | Consultation | Opérations |
| --- | --- | --- |
| Étudiant éligible | Activités publiées de ses offres, ses remises et son feedback diffusé | Remettre dans la fenêtre, dans la limite des tentatives, et demander une révision |
| Responsable du groupe de travail | Copie collective du groupe dont il fait partie | Envoyer et actualiser le dépôt collectif |
| Enseignant principal ou intervenant affecté | Activités, copies et historique de ses offres | Préparer, publier, clôturer, constituer les groupes, corriger, finaliser et diffuser selon la politique |
| Assistant | Fonctions existantes selon sa délégation | L’accès aux copies et corrections exige une affectation d’intervenant active et la permission de gestion des cours |
| Administration de la faculté | Activités, copies, corrections et flux Results de son périmètre | Actions pédagogiques, validation de lot et réouverture motivée |

Les décisions étudiantes réutilisent `AcademicAccessService` pour les cours, inscriptions, groupes, droits administratifs et règles de participation. L’administration réutilise la permission `publish academic content` et `TeachingScope`. L’enseignant doit posséder un compte lié actif et `manage courses`. Les années clôturées restent consultables selon les droits de lecture.

Les audits tracent création, barèmes, changements d’état, versions reçues, correction, validation, réouverture et demande de révision. Les nouveaux audits de remise se limitent à la version et au retard. Les textes et pièces restent dans leurs modèles privés. Les notifications Laravel sont génériques, dédupliquées et ouvrent une vue recalculant les accès. Les rappels automatiques d’échéance sont reportés.
