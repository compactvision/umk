# Audit initial des admissions

Baseline locale SQLite avant changement : 244 tests, 150 684 assertions, aucun échec. Les routes actives utilisent `App\Modules\Enrollment` ; les classes homonymes sous Admissions ne constituent pas un second parcours à activer.

| Parcours | Code actif | Constat initial |
|---|---|---|
| Catalogue et formulaire | Pages Admission et Enrollment, contrôleurs Enrollment et Requirements, référentiels de phase 02 | Catalogue et choix officiels déjà présents. L'appel des conditions inverse les identifiants de faculté et de niveau. |
| Brouillons | DraftController, SaveProgressUseCase, stockage temp/local | Sauvegarde et reprise par UUID, expiration lue sur le dernier brouillon. Les mutations n'appliquent pas toutes l'expiration. |
| Soumission | SubmitEnrollmentUseCase, EnrollmentValidator, MatriculeGenerator | Verrou de dossier et matricule unique. Le contrôle de complétude ne vérifie pas les pièces persistées ni l'ouverture de l'année. Date de soumission et événement manquants. |
| Suivi et fichiers | EnrollmentController, DocumentController, pages candidat | Session et périmètre propriétaire, accès fichiers privés. Examiner la liste des événements communiqués et les métadonnées de fichier. |
| Administration | EnrollmentManagementController, ReviewEnrollment, CompleteEnrollmentReview, RecordEnrollmentDecision | Analyse et pièces individuelles journalisées. Rôle admin au routage. Les files de suivi sont partielles et l'admission ne contrôle pas la disponibilité actuelle du contexte. |
| Étudiant | StudentAdmissionService, AcademicAdministrationController, Identity | Compte existant vérifié, rôle étudiant, profil et inscription unique. Une validation crée une inscription déjà confirmée. |
| Communication | Mail, notifications Laravel, événements de dossier | Envoi post-commit ; le reçu de soumission manque de résultat d'envoi historisé. |
| Tests | EnrollmentJourney, EnrollmentReviewWorkflow, AdminEnrollmentManagement, StudentEnrollmentPortal, StudentAcademicJourney, PhaseOneSecurity | Bon socle de régression ; compléter les cas de soumission réelle et les limites des accès initiaux. |

Priorités : garantir les règles côté serveur, figer le contexte officiel à la soumission, protéger l'historique, séparer admission et confirmation annuelle, consolider les files sur l'écran existant.
