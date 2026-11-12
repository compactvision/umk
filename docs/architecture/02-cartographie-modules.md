# Cartographie des modules réels

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

Les classes de `app/Modules` utilisent Domain/Application/Infrastructure, avec des exceptions : modèles Eloquent partagés dans `app/Models`, anciens services `app/Services` et contrôleurs historiques `app/Http/Controllers`. `bootstrap/providers.php` enregistre Identity, AcademicYear, Faculty, Level, LevelDetail, AdmissionCondition, Enrollment, Blog, Site, Newsletter. Student, Teaching et Seo sont appelés directement depuis `routes/web.php` sans provider propre ; ce n’est pas une preuve d’absence.

| Domaine / emplacement | Responsabilité et points d’entrée | Dépendances réelles | Limites / prochaine amélioration |
|---|---|---|---|
| Identity | `/login`, `/register`, email, reset, OAuth ; UseCases LoginUser/RegisterUser/ResetPassword | UserRepository → EloquentUserRepository, hasher, notifier, cache limiter, Spatie | Ancien `routes/auth.php` non inclus ; entité role singulier et rôles Spatie à réconcilier |
| Enrollment | Brouillons, pièces, soumission, décisions ; `/dashboard/enrollments`, `/dashboard/admin/enrollments` | EnrollmentRepositoryInterface, DocumentRepositoryInterface, Storage, matricule, StudentAdmissionService | SaveProgress mélange orchestration, stockage et snapshot ; extraction ciblée des pièces avant extension |
| Admissions | Onboarding/entités dans `app/Modules/Admissions` | Repository/DTO/ValueObjects présents | Deux contrôleurs de zéro ligne ; pas d’entrée active observée dans web.php. Ne pas confondre ce squelette avec le parcours Enrollment actif |
| Student | `/dashboard/student`, `/dashboard/admin/student-academic` ; profil, accès, finance, ressources, demandes | `app/Models/Student`, Enrollment, Teaching, AcademicAccessService, StudentFinanceService, Audit | 275 lignes dans AcademicAdministrationController, 218 dans StudentPortalController ; trop de sous-domaines réunis |
| Teaching | Affectations, séances, présences, semestres ; admin schedule/professors | Modèles Student AcademicOffering/Session/Semester, Courses, Professor ; services Schedule/Semester/TeachingAssignment | Verrouillage central de l’année : sûr mais contention potentielle à mesurer |
| AcademicYear | CRUD et ouverture/clôture ; admin academic-years | Repository, Eloquent AcademicYear, transactions | Portée annuelle partagée, verrouillage global à mesurer |
| Faculty / Level / LevelDetail / AdmissionCondition | Structure, catalogues, tarifs et conditions ; admin faculties/levels | DTO/use cases/repositories et modèles partagés | Conserver contrats de routes ; séparer barème et règle financière progressivement |
| Site | Site singleton et logos ; admin site, API site | SiteDto/GetSiteInfo/SaveSiteInfo, EloquentSiteRepository | API de mutation sécurisée ; singleton et uploads à mieux transactionnaliser |
| Blog | Articles, catégories, vidéos ; admin posts, pages publiques | Services Create/Update/Publish, repositories et modèles internes | PostController 240 lignes ; politique et publication à vérifier par acteur |
| Newsletter | Subscribe/unsubscribe via routes API du provider | DTO/use cases/repository | Pas de preuve de double opt-in ; unsubscribe par email et absence de throttle à traiter |
| Seo | SEO, légal, audience, sitemap/robots ; routes web | PublicSsrGateway, modèles Seo et middleware SeoResponse | Données institutionnelles cachables ; audience et cookies à revoir selon politique retenue |

## Entrées et couches transversales

`routes/web.php` porte la majorité des contrats ; les providers Site et Newsletter chargent aussi leurs routes API. Le seul examen de web.php aurait manqué SEC-01. Middlewares : auth/verified Laravel, rôles/permissions Spatie, EnsureApplicationKey, HandleInertiaRequests, SeoResponse. Policies présentes : EnrollmentPolicy, FacultyPolicy et PostPolicy. Les contrôles inline des contrôleurs font aussi partie de l’autorisation effective.

Des DTO sont réellement utilisés : SaveProgressDTO, SubmitEnrollmentDTO, UploadDocumentDTO, SiteDto, DTO Blog et AdmissionCondition. Des repositories sont liés par les providers ; ne pas ajouter une couche de repositories parallèle. Des notifications et Mailables existent ; pas de dossier de Jobs métier dédié identifié. `ShouldQueue` et l’activation réelle d’un worker ne sont pas établis par la présence de Queueable.

Frontend : `resources/js/pages/dashboard` contient pages Inertia par domaine, `components/layouts/Dashboard` le layout et la sidebar, `components/student/navigation.ts` les groupes étudiant. Portal.tsx compte 657 lignes et Course.tsx 383 au moment de l’inspection. Typage/build et 51 tests frontend passent ; pas de validation navigateur exhaustive responsive/accessibilité.

Navigation observée : « Crédits acquis », « Délibérations », « Messagerie », « Bibliothèques », « Préférences » et plusieurs autres entrées n’ont pas de `section` dans navigation.ts. Leur présence ne prouve aucune fonctionnalité. « Notes et bulletins » mène aux ressources de résultats, pas à un moteur de notes/délibérations complet. Les fichiers frontend déjà modifiés par l’utilisateur sont préservés.

## Frontières proposées, sans déplacement massif

Conserver Identity pour identité/session, Enrollment pour candidature/décision, Student pour dossier/inscription/contexte. Extraire progressivement Finance à partir de StudentFinanceService/ProviderPaymentReconciliation et Documents à partir du flux de pièces. Teaching garde offre/séance/présence. Les futurs Assessments/Results consommeront une inscription et une offre identifiées ; aucune écriture directe dans les écritures financières. Communication consommera des événements après commit ; ne pas faire dépendre Finance du rendu React ou des Mailables. Formaliser les interfaces avant extraction et vérifier le graphe de dépendances ; aucune absence de cycle n’est certifiée par cet examen manuel.
