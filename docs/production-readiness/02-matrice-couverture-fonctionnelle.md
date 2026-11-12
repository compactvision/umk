# Couverture des phases 01 à 13

Le statut « testé » vise le parcours nommé et les preuves du dépôt. La recette institutionnelle sur une installation représentative reste un contrôle distinct.

| Phase et exigence | Entrée HTTP et interface | Service ou domaine | Preuve automatisée | État |
| --- | --- | --- | --- | --- |
| 01 Connexion, rôle, site | `/login`, site public et administration | Identity, Policies, Site et SEO | PhaseOneSecurityTest, CredentialRevocationTest, SeoPublicTest | Parcours testés. Secrets et proxy de production à contrôler. |
| 02 Candidature et décision | `/dashboard/enrollments`, liste admissions | Enrollment, pièces, activation | EnrollmentJourneyTest, AdmissionConsolidationTest, EnrollmentReviewWorkflowTest | Parcours testés. Campagne réelle à recetter. |
| 03 Structure et maquettes | `/dashboard/admin/academic-structure` | StructureService, CurriculumService | AcademicStructureTest, AcademicStructureMigrationTest | Versions et rattachements testés. |
| 04 Profil et dossier | `/dashboard/student/profile`, dossier 360° | StudentProfile et StudentDossierService | ProfileUpdateTest, StudentManagementTest | Identité et périmètres testés. |
| 05 Inscriptions | `/dashboard/student/enrollments`, administration | AcademicEnrollmentService | AcademicEnrollmentManagementTest, EnrollmentManagementFollowupTest | Réinscription, transfert et historique testés. |
| 06 Finance | `/dashboard/admin/finance`, transactions | StudentFinanceService, reçus et rapprochements | UniversityFinanceTest, PostgresConcurrencyTest | Registre testé. Prestataire et rapprochement réel à recetter. |
| 07 Enseignements | `/dashboard/admin/teaching`, cours étudiants | CourseRegistrationService, TeachingScope | AcademicTeachingTest | Affectations et périmètres testés. |
| 08 Planning | `/dashboard/admin/schedule`, emploi du temps | Schedule et Calendar | AcademicSchedulingTest, ScheduleModuleTest | Horaires et conflits testés. |
| 09 Supports | Cours étudiant et espace enseignant | LearningAccess, LearningFiles | LearningContentTest | Ressources privées et versions testées. |
| 10 Évaluations | Devoirs, évaluations et espace enseignant | AssessmentSubmissions, AssessmentWorkflow | AssessmentWorkflowTest | Dépôts, corrections et états testés. |
| 11 Résultats | `/dashboard/admin/academic-results`, résultats | Deliberations, ResultRules | OfficialResultCalculatorTest, AcademicTeachingTest | Calcul, jury et révisions testés. Règlements réels à approuver. |
| 12 Documents | `/dashboard/admin/official-documents`, vérificateur | DocumentWorkflow, DocumentArchives | OfficialDocumentWorkflowTest, CardRequestTest | Émission, révocation, intégrité et carte testées. Modèles et imprimantes à recetter. |
| 13 Progression | `/dashboard/admin/progression`, réinscription | AcademicLifecycle, GraduationEvidence | AcademicLifecycleTest, StudentAcademicJourneyTest | Cas de parcours et fin de cursus testés. Règles par programme à valider. |

Les tests parcourent les frontières par domaine. Une recette continue avec comptes institutionnels de test et données approuvées reste à exécuter. [Scénarios par rôle](19-recette-fonctionnelle.md)
