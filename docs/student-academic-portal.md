# Parcours étudiant après validation administrative

État vérifié le 1 novembre 2026. L’application conserve ses comptes, ses matricules et son processus de candidature existants.

## Fonctionnalités livrées

La validation administrative appelle `StudentAdmissionService` dans la transaction de décision. Le service contrôle le dossier, les pièces acceptées et le contexte, conserve le matricule et le compte existants, ajoute le rôle `student` sans supprimer les autres rôles, et crée un profil et une inscription académique uniques. Une répétition ne crée aucun doublon. La notification d’accueil est déclenchée après commit ; l’email de validation existant ouvre directement le portail.

Le portail `/dashboard/student` présente l’identité, la photo disponible, le matricule, la faculté, le niveau/programme, l’année et le groupe éventuel. Il permet de changer de contexte académique et propose les cours, horaires, supports, travaux avec dépôts privés versionnés, évaluations, résultats personnels, frais, transactions et reçus imprimables, documents, annonces et demandes. Les écrans vides reflètent les données réellement publiées. Une archive permet de retrouver ses propres dépôts. La navigation, les cartes verrouillées, les messages, les skeletons et les notifications suivent le style premium et les écrans mobiles.

Les cours du catalogue existant sont affectés à une année, un niveau, un groupe éventuel, une période et un enseignant. Les publications, cours optionnels et exceptions individuelles déterminent ce que chaque étudiant voit. Les ressources et justificatifs sont téléchargés par des routes authentifiées et autorisées ; aucun lien public n’est créé.

La gestion `/dashboard/admin/student-academic` comporte les onglets Étudiants, Finances, Règles, Enseignement et Demandes. Les capacités sont séparées : `manage academic access`, `manage academic finance`, `publish academic content`. Les opérations sensibles sont auditées avec auteur et motif.

## Statuts distincts

- La candidature conserve son statut existant, notamment `validated`.
- Le profil étudiant : `active`, `suspended`, `graduated`, `archived`.
- L’inscription académique : `pending_confirmation`, `confirmed`, `suspended`, `completed`, `cancelled`.
- La situation financière est calculée depuis les obligations, paiements confirmés et ajustements valides : `unpaid`, `partial`, `cleared`, `exempted`, `overdue`. Un barème non affecté est explicitement indiqué comme restant à confirmer.

Le paiement n’entraîne pas une validation administrative. Un rôle seul ne donne aucun accès aux données d’un autre étudiant. Une suspension reste applicable malgré un règlement financier.

## Migration et mise en service

Migration ajoutée : `database/migrations/2026_11_01_180000_create_student_academic_portal.php`. Elle crée les tables dédiées aux profils, inscriptions académiques, audits, obligations, paiements, ajustements, règles, affectations, exceptions, séances, ressources, dépôts et demandes. Les clés étrangères et contraintes d’unicité protègent les rattachements et l’idempotence. Aucune migration antérieure n’a été modifiée pour ce module.

Sur l’environnement local, cette migration a été appliquée et le dossier déjà validé `USK-000001` a été rattaché au portail avec son matricule d’origine. Aucun paiement, résultat ou cours de démonstration n’a été ajouté et aucun email n’a été envoyé par la reprise.

Pour un autre environnement, après sauvegarde et déploiement :

```sh
php artisan migrate --force
php artisan student:activate-validated --dry-run
php artisan student:activate-validated
```

La reprise est idempotente et ne notifie pas par défaut. `--notify` permet les notifications d’accueil explicitement demandées. Elle signale les dossiers incomplets au lieu de les activer silencieusement. Ne pas exécuter `migrate:fresh` hors des tests isolés.

## Règles d’accès

`AcademicAccessService` est la source commune des autorisations affichées et appliquées aux routes.

- Le tableau de bord, l’identité, le suivi financier, les reçus et l’assistance restent accessibles dans un contexte appartenant à l’utilisateur.
- Les cours et horaires publiés sont consultables avant paiement. Les résultats restent accessibles par défaut.
- Les supports, dépôts de travaux, évaluations et demandes de documents attendent une règle explicite de l’administration.
- Une règle peut ouvrir, masquer, exiger le règlement intégral, un minimum, la première tranche ou une exonération. Elle peut accepter un échéancier approuvé ou une exonération valide.
- La priorité va au niveau, puis à l’année, puis à la dernière version active du même périmètre. Une modification crée une nouvelle version ; une désactivation laisse s’appliquer une éventuelle règle de périmètre plus général.
- Une restriction des évaluations ou résultats requiert une référence au règlement, une confirmation explicite et un audit. Aucun blocage financier des résultats n’est introduit automatiquement.
- Les obligations et autorisations sont ventilées par type de frais. Les montants sont calculés en centimes ; un paiement en attente ne compte pas. Les crédits d’une catégorie ne sont pas affectés automatiquement à une autre.
- Les exonérations, bourses, échéanciers et dérogations sont datés et justifiés. Les échéances échues sont prises en compte. Une dérogation ne contourne ni suspension, ni affectation, ni publication, ni service explicitement masqué.
- Les dépôts nécessitent une inscription active et une année ouverte, ainsi que le respect des dates de dépôt. Les archives consultables restent personnelles.
- Les droits sont recalculés à chaque accès et actualisés périodiquement dans le portail ; annulation, remboursement, expiration ou suspension peuvent donc retirer l’accès concerné.

## Configuration administrative disponible

1. Confirmer la catégorie nationale/étrangère et affecter les deux tranches réelles du niveau avec leurs échéances. La devise est USD. Ajouter des obligations distinctes si nécessaire.
2. Enregistrer un paiement hors ligne en attente ; le confirmer après contrôle comptable. Annuler ou marquer un remboursement avec motif et audit. Ces actions enregistrent la situation comptable : elles ne déplacent pas de fonds.
3. Accorder une bourse, une exonération, un échéancier cohérent avec les frais nets ou une dérogation limitée dans le temps ; révoquer ces autorisations avec motif.
4. Configurer les règles par service, niveau, année et type de frais, puis publier ou retirer les éléments pédagogiques.
5. Gérer les statuts, les groupes, les cours optionnels et exceptions ; traiter les demandes étudiantes et consulter les audits autorisés.

## Validation réalisée

Commande de régression ciblée :

```sh
php artisan test --compact tests/Feature/StudentAcademicJourneyTest.php tests/Feature/EnrollmentReviewWorkflowTest.php tests/Feature/StudentEnrollmentPortalTest.php tests/Feature/AdminEnrollmentManagementTest.php tests/Feature/EnrollmentJourneyTest.php tests/Feature/ProfessionalEmailsTest.php
node --test tests/Frontend/*.test.mjs
npm run build
```

Résultats finaux : **57 tests PHP réussis, 1 032 assertions ; 38 tests frontend réussis ; build Vite réussi**. Le module étudiant ne présente aucun diagnostic TypeScript dans la vérification ciblée.

Les 24 tests du nouveau parcours couvrent notamment : activation complète, conservation du matricule et des autres rôles, idempotence, pièces incomplètes, notification après commit, accès sans paiement, refus par rôle seul, téléchargement et dépôts protégés, paiements partiels/en attente, seuils, exonérations et expiration, bourses et types de frais, annulation/remboursement, échéancier, suspension, confidentialité entre étudiants et années, publication et cours optionnels, restrictions réglementaires, capacités du personnel, assistance, reprise historique, parcours HTTP comptable et reçu, dates de dépôt, absence de fournisseur configuré, état financier du dossier historique et fonctionnalités masquées.

Vérification visuelle réalisée sur navigateur, bureau et largeur 390 px, sans créer de transaction réelle.

Limites de la vérification globale : une exécution de toute la suite a obtenu 99 succès et 22 échecs sur les anciens tests d’authentification/profil/site (factories, anciens champs `name`, routes désactivées et attentes de redirection). Cette exécution précédait l’ajout du dernier test de visibilité. Ces incompatibilités ne sont pas corrigées dans le périmètre de ce module. Le contrôle TypeScript global rencontre également des erreurs préexistantes, dont un ancien composant `CourseCard.tsx` syntaxiquement incomplet ; le build Vite et le contrôle ciblé du nouveau module passent.

## Connexions externes

Aucun prestataire de paiement n’est présumé. `config/student.php` laisse `payment_verifier` à `null`. Le contrat `PaymentProviderVerifier` et `ProviderPaymentReconciliation` sont prêts pour un adaptateur qui vérifie signature, transaction côté serveur, référence, montant et devise. Il n’existe pas de webhook public activé sans cet adaptateur. Une affirmation de paiement réussie envoyée par le navigateur n’est jamais une confirmation comptable.

Les emails utilisent le transport Laravel déjà configuré ; sa délivrabilité et le traitement des queues relèvent du déploiement existant. Les reçus sont imprimables depuis les écritures confirmées, sans service PDF externe. Aucun LMS, visioconférence ou banque externe n’a été inventé.

## Décisions métier à valider

- La catégorie nationale/étrangère de chaque étudiant doit être confirmée ; elle n’est pas déduite arbitrairement des anciennes candidatures.
- L’établissement doit définir les échéances, règles par service, justificatifs comptables et éventuelles restrictions prévues par son règlement.
- Les véritables cours, périodes, groupes, horaires, supports et résultats doivent être renseignés et publiés par les personnes habilitées.
- Le modèle existant ne comporte pas de département ou programme distinct : le portail utilise les facultés/niveaux réels et n’invente pas de structure académique.
- Choisir le fournisseur de paiement et ses procédures de rapprochement/remboursement avant tout encaissement en ligne.

## Fichiers créés

- `app/Models/Student/AcademicAudit.php`
- `app/Models/Student/AcademicEnrollment.php`
- `app/Models/Student/AcademicOffering.php`
- `app/Models/Student/AcademicResource.php`
- `app/Models/Student/AcademicSession.php`
- `app/Models/Student/AcademicSubmission.php`
- `app/Models/Student/AccessRule.php`
- `app/Models/Student/CourseException.php`
- `app/Models/Student/FinancialAdjustment.php`
- `app/Models/Student/ServiceRequest.php`
- `app/Models/Student/StudentObligation.php`
- `app/Models/Student/StudentPayment.php`
- `app/Models/Student/StudentProfile.php`
- `app/Modules/Student/Application/Services/AcademicAccessService.php`
- `app/Modules/Student/Application/Services/AcademicRuleService.php`
- `app/Modules/Student/Application/Services/Audit.php`
- `app/Modules/Student/Application/Services/Money.php`
- `app/Modules/Student/Application/Services/ProviderPaymentReconciliation.php`
- `app/Modules/Student/Application/Services/StudentAdmissionService.php`
- `app/Modules/Student/Application/Services/StudentFinanceService.php`
- `app/Modules/Student/Domain/Payments/PaymentProviderVerifier.php`
- `app/Modules/Student/Domain/Payments/VerifiedPayment.php`
- `app/Modules/Student/Infrastructure/Http/Controllers/AcademicAdministrationController.php`
- `app/Modules/Student/Infrastructure/Http/Controllers/DashboardEntryController.php`
- `app/Modules/Student/Infrastructure/Http/Controllers/StudentPortalController.php`
- `app/Notifications/StudentAdmissionActivated.php`
- `config/student.php`
- `database/migrations/2026_11_01_180000_create_student_academic_portal.php`
- `docs/student-academic-portal.md`
- `resources/css/dashboard/student-academic.css`
- `resources/css/student-portal.css`
- `resources/js/components/student/PortalCards.tsx`
- `resources/js/components/student/types.ts`
- `resources/js/pages/dashboard/student/Portal.tsx`
- `resources/js/pages/dashboard/studentAcademic/AcademicForm.tsx`
- `resources/js/pages/dashboard/studentAcademic/Index.tsx`
- `resources/views/student/receipt.blade.php`
- `tests/Feature/StudentAcademicJourneyTest.php`
- `tests/Frontend/student-portal.test.mjs`

## Fichiers existants modifiés pour cette intégration

- `app/Models/User.php`
- `app/Models/Enrollment.php`
- `app/Modules/Enrollment/Application/UseCases/RecordEnrollmentDecision.php`
- `app/Mail/EnrollmentReviewUpdated.php`
- `app/Modules/Enrollment/Infrastructure/Http/Controllers/EnrollmentController.php`
- `app/Modules/Enrollment/Infrastructure/Http/Controllers/EnrollmentManagementController.php`
- `app/Modules/Enrollment/Infrastructure/Http/Controllers/EnrollmentNotificationController.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
- `app/Http/Controllers/Auth/RegisteredUserController.php`
- `database/seeders/RolePermissionSeeder.php`
- `routes/web.php`
- `routes/console.php`
- `resources/js/lib/studentEnrollment.ts`
- `resources/js/components/layouts/Dashboard/Dashboard.tsx`
- `resources/js/components/layouts/Dashboard/DashboardHeader.tsx`
- `resources/js/components/layouts/Dashboard/Sidebar.tsx`
- `resources/js/components/admin/AdminNotifications.tsx`
- `resources/js/components/admin/AppsNavigation.tsx`
- `resources/js/components/section/dashboard/enrollement/EnrollmentShowSection.tsx`
- `resources/js/pages/dashboard/enrollments/Index.tsx`
- `public/build/manifest.json` et les assets compilés correspondants.

Le workspace comporte également les modifications antérieures du projet ; cette liste décrit le périmètre du parcours étudiant.

## Accueil synthétique — mise à jour du 1 novembre 2026

L’accueil est alimenté par `StudentOverviewService` et rendu par `StudentOverview.tsx`. Les compteurs portent sur les séances restantes du jour/de la semaine à Kinshasa, y compris les séances en cours, exclusivement pour les affectations publiées du contexte courant. La liste affiche au plus six prochaines séances par période, sans tronquer les compteurs.

Les alertes utilisent le montant effectivement en retard, les conditions documentaires réelles et les évaluations publiées dans les quatorze jours. Les pièces signalées renvoient au dossier sécurisé ; elles ne rouvrent pas automatiquement une candidature validée. Les quatre derniers résultats sont strictement nominatifs et soumis aux droits d’accès ; les quatre dernières annonces proviennent des enseignements affectés. Les dates affichées sont les dates de mise à jour, car le modèle n’a pas de date de publication distincte. Aucun calcul de moyenne ou de note n’est inventé à partir du texte publié.

Les raccourcis ouvrent les démarches documentaires, le suivi financier et les demandes/réclamations. Ils ne simulent ni paiement en ligne ni délivrance automatique d’attestation. Le résumé est réactualisé toutes les trente secondes et à chaque retour à l’accueil. Sans publication, les cartes restent explicitement vides. Le projet ne possède pas encore de publication autonome par département : les annonces affichées sont celles du parcours réellement affecté.

Les icônes `Sparkles` ont été retirées des sources et remplacées par des icônes de boussole, institution, calculatrice, santé, distinction ou progression, selon le contexte.

Vérification complémentaire : tests des limites de jour/semaine à Kinshasa, confidentialité des résultats, publications retirées, alertes financières/documentaires, suppression de l’alerte après règlement confirmé, rendu sans données, résultat verrouillé et liens vers les annonces. Vue bureau et mobile 390 px contrôlées sans débordement horizontal. Aucune donnée pédagogique ni transaction de démonstration n’a été ajoutée à la base locale.

## Matricules par faculté

Les nouvelles soumissions utilisent le code alphabétique de la faculté et un numéro d’entrée sur au moins quatre chiffres : `MED0001`, `MED0002`, `DR0001`. Le compteur est commun aux niveaux et aux années d’une faculté ; il ne repart pas à zéro à la rentrée. Après 9999, le numéro continue naturellement avec cinq chiffres. Le code doit contenir 1 à 12 lettres ; une erreur explicite empêche l’attribution si ce code n’est pas exploitable.

La migration additive `2026_11_01_200000_create_faculty_matricule_sequences_table.php` crée un compteur par code. La réservation est transactionnelle avec verrouillage du compteur, initialisation depuis les numéros déjà présents dans les dossiers/profils/inscriptions académiques, et contrôle des collisions. Les identifiants déjà attribués restent conservés, notamment lors de l’activation et des nouvelles tentatives de soumission. Aucun historique n’est renuméroté.

Vérification ciblée : 51 tests réussis, 919 assertions, dont séquences entre niveaux/années, indépendance des facultés, reprise d’un numéro existant, compatibilité des anciens matricules, dépassement de quatre chiffres et refus d’un code invalide. La migration a été appliquée localement sans création de dossier de démonstration.

## Reprise des étudiants déjà inscrits

À la demande de l’utilisateur, les anciens matricules peuvent désormais être convertis avec `php artisan student:migrate-matricules --dry-run`, puis `php artisan student:migrate-matricules`. La reprise suit l’ordre de création des dossiers, conserve les identifiants déjà au nouveau format, synchronise dossiers, profils, inscriptions académiques et notifications d’accueil persistantes, et journalise les correspondances ancien/nouveau. La simulation annule toutes ses écritures ; l’application est atomique et idempotente. Une erreur annule l’ensemble du traitement. Les emails déjà envoyés et les anciens événements d’audit restent des archives historiques.

Application locale réalisée : dossier `USK-000001`, ancien matricule `20260100001`, nouveau matricule `MED0001`. Les écrans et reçus utilisent les données actuelles ; aucun identifiant de compte, référence de dossier ou paiement n’a changé. Vérification ciblée : 35 tests, 533 assertions, incluant simulation sans écriture, synchronisation et relance sans doublon, plus annulation sur code faculté invalide.

## Organisation de l’accueil après la fiche profil

L’ordre demandé est désormais : frais obligatoires, horaire du jour, évaluations en cours, liste des cours du niveau. Chaque section propose « Voir plus » vers la rubrique complète. Les annonces et résultats restent accessibles via les onglets dédiés. L’ancien bandeau financier et le résumé académique ne se répètent plus avant le rappel des frais sur l’accueil.

Le rappel ventile les frais réellement affectés par type (académiques et connexes), montant net, paiements confirmés et solde. Les types de frais connexes ne sont pas inventés si aucune obligation correspondante n’existe. L’horaire du jour inclut maintenant les séances terminées, en cours et à venir de la journée de Kinshasa, avec accès à l’horaire complet. Les évaluations « en cours » ont une ouverture passée et une clôture future ou non renseignée ; les énoncés restent protégés lorsque l’accès est conditionnel. La liste des cours conserve les titulaires, codes et crédits réels des enseignements publiés et affectés.

Vérifications : 36 tests du parcours étudiant, 554 assertions ; 41 tests frontend ; build réussi et aucun diagnostic TypeScript dans le module étudiant. Les tests contrôlent notamment l’ordre des sections, la ventilation des frais, les périodes d’évaluation et la confidentialité des énoncés.

## Page profil étudiant

`/dashboard/student/profile` réutilise la fiche de l’accueil et propose un bouton de changement de mot de passe dans cette fiche. Le formulaire comprend : identité (nom, postnom, prénom, naissance, sexe, état civil), compte/contact, origine/résidence/description, personne à prévenir, diplôme d’accès et photo avec aperçu. Les 26 provinces administratives et l’option « Autre » sont proposées ; la référence utilisée est le [Ministère de l’Intérieur](https://interieur.gouv.cd/ministere/territoires). Les coordonnées et la photo enregistrées alimentent ensuite la fiche de l’accueil.

Migration ajoutée et appliquée localement : `2026_11_01_210000_add_personal_details_to_student_profiles.php`. Elle ajoute uniquement les détails personnels JSON et les métadonnées de photo privée. Les documents d’admission restent distincts et leurs validations sont conservées. Le retour à la photo du dossier retire seulement la photo personnelle ajoutée.

Le matricule et les statuts sont protégés côté serveur. Les routes sont authentifiées et limitées au contexte académique appartenant à l’utilisateur. La photo (JPG/PNG/WebP, 5 Mo maximum) est téléchargée via une route privée sans cache public ; un remplacement supprime l’ancienne photo personnelle après commit. Aucun mot de passe n’est journalisé. La fenêtre de changement exige le mot de passe actuel, une confirmation et un nouveau mot de passe d’au moins huit caractères contenant lettres et chiffres ; le jeton de connexion persistante est renouvelé et la session régénérée. Un changement d’email nécessite le mot de passe actuel, une adresse unique et une nouvelle vérification par email.

Fichiers dédiés : `StudentProfileController.php`, `UpdateStudentProfileRequest.php`, `config/student_profile.php`, `StudentProfileForm.tsx`, `student-profile.css`, migration précitée et `tests/Frontend/student-profile.test.mjs`. Les modèles, routes, contrôleur de portail, types, fiche d’identité et tests du parcours sont intégrés au module existant.

Vérification : 74 tests PHP / 1 341 assertions, 43 tests frontend, build réussi, contrôle TypeScript du module étudiant sans diagnostic. Les nouveaux tests couvrent la sauvegarde des informations, le matricule protégé, l’isolation des photos, les fichiers refusés, les justificatifs inchangés, les identifiants actuels requis, la confidentialité des mots de passe, la nouvelle vérification d’email et les champs conditionnels. Formulaire et fenêtre contrôlés visuellement, y compris à 390 px ; aucun profil réel ni mot de passe réel n’a été modifié pendant ces essais.
