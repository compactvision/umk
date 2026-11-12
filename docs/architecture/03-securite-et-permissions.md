# Sécurité et permissions

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

## Moteur effectif

Spatie laravel-permission, trait HasRoles sur User, aliases role/permission/role_or_permission dans bootstrap/app.php. Source des rôles déclarés : `database/seeders/RolePermissionSeeder.php`. Ce seeder attribue avec givePermissionTo ; ce n’est pas une synchronisation/révocation des anciens droits. La population et les rôles de production n’ont pas été lus.

| Acteur déclaré | Droits attribués par seeder | Accès réellement contraint côté serveur |
|---|---|---|
| user | view dashboard | auth+verified ; candidature personnelle ; dashboard redirige vers enrollments |
| candidate | apply to programs, view application status | Même route candidature ; pas de profil académique automatique |
| student | dashboard, courses, assignments, grades | StudentPortalController::context exige student et son propre StudentProfile ; AcademicAccessService exige inscription/année/règles selon feature |
| professor | manage courses, grade assignments, manage students | Pas d’espace enseignant spécifique établi ; routes Teaching administratives exigent admin |
| admin | gestion utilisateurs/contenu/configuration/facultés et trois permissions académiques | role:admin sur administration ; contrôle supplémentaire finance/access/publish dans AcademicAdministrationController |
| super admin | toutes permissions présentes lors du seeding | Aucune exemption globale observée ; role:admin ne découle pas automatiquement de ces permissions |

Les références `staff` dans EnrollmentPolicy et `manager` dans FacultyPolicy ne correspondent pas aux rôles du seeder. Ne pas attribuer ces rôles ou élargir les droits sans décision métier. `FacultyPolicy::viewAny` utilise faculties.view non déclarée et delete appelle students() à vérifier avant activation ; les routes actives possèdent aussi le garde admin. Policies et contrôles de route ne sont pas entièrement unifiés.

## Isolation observée

- StudentPortalController::context part du profil du compte et filtre academic/application dans ce contexte : un ID d’une autre inscription n’élargit pas le périmètre.
- Ressources : offre publiée accessible, année/niveau/groupe/option, publication et student_profile_id vérifiés ; résultat personnel exige l’identifiant du profil.
- Soumissions et reçus : requête depuis l’inscription personnelle ; documents Enrollment : propriétaire ou admin ; suppression réservée au propriétaire d’un brouillon.
- Administration globale par rôle admin ; pas de cloisonnement par faculté pour les administrateurs observé. Ce n’est pas un modèle multiétablissement. Aucun tenant ne doit être inventé.
- Activation StudentAdmissionService exige dossier validé et pièces acceptées, crée profil/inscription sous transaction et conserve catégorie financière non évaluée. AcademicAccessService refuse les fonctions soumises à règle quand celle-ci manque. Une admission ne suffit donc pas à tout autoriser.
- Couverture existante : AdminEnrollmentManagementTest, StudentAcademicJourneyTest, EnrollmentJourneyTest ; nouveaux refus API et uploads interutilisateurs dans PhaseOneSecurityTest.

## Corrections et limites

POST/PUT `/api/site` exigent désormais session web/CSRF, connexion, email vérifié et rôle admin. Le GET reste public. Le contrat de mutation non authentifiée était la faille : les clients doivent désormais présenter une session administrateur et un token CSRF. Aucun second moteur de permissions ajouté.

Uploads temporaires : contenu MIME validé au serveur, nom de stockage fixe, préfixe lié à user id, refus des chemins étrangers/traversées avant mutation, erreurs de stockage signalées. Les anciens uploads temporaires sans propriétaire doivent être téléversés à nouveau ; les pièces permanentes ne sont ni déplacées ni supprimées. Le format de réponse JSON temp est conservé, son chemin reste opaque.

Login/register/OAuth régénèrent la session ; logout invalide son contenu et renouvelle CSRF. Erreurs textuelles login uniformisées. Le limiter conserve maintenant ses données une heure, contrairement aux 60 secondes initiales. Les mises à jour et remises à zéro du compteur sont maintenant protégées par Cache::lock. Une vérification de hash factice accompagne le compte inconnu pour réduire la différence de coût ; cela ne certifie pas une égalité temporelle absolue. Cinq tests du limiter autrefois rangés dans app/ ont été déplacés dans tests/Feature et passent.

Reset : broker Laravel, rotation remember_token, événement PasswordReset et retour login. RevokeCredentials supprime les tokens personnels du compte et ses sessions database, en préservant la session courante pour un changement depuis le profil. AuthenticateSession protège les requêtes web par empreinte du mot de passe. Tests : token reset non rejouable, sessions révoquées, session obsolète rejetée, tokens d’un autre compte préservés. Un changement d’email exige le mot de passe actuel, révoque les anciens accès et impose une nouvelle vérification. Pour un autre driver de sessions, vérifier la stratégie de déploiement/invalidation des sessions préexistantes avant activation opérationnelle.

Cookies configurés HttpOnly et SameSite lax par défaut ; secure dépend de l’environnement. Pas de preuve HTTPS/proxy/cookies de production. Vérification email par lien signé ; tests actifs corrigés vers /email/verify. Routes reset-request désormais limitées à 6/minute par IP. Aucun test navigateur complet CSRF, OAuth, activation email réelle ou cookies cross-site effectué.

OAuth est désormais fermé par défaut pour les fournisseurs autres que Google/Facebook. Le service exige une preuve explicite d’email vérifié fournie par Google ; Facebook sans cette preuve est refusé avec invitation à utiliser le mot de passe. Un compte local non vérifié ne peut pas être lié silencieusement. L’inscription sociale vérifiée persiste sa vérification et n’attribue que user ; tests positifs et négatifs passent. Aucun appel à un fournisseur réel effectué. Inscription min:6 contre reset min:8 : politique de mot de passe à uniformiser par décision explicite.

## Fichiers et audit

Disques local/private vers storage/app/private ; public vers storage/app/public. Lien public/storage vise uniquement app/public dans la configuration. Doublon de clé private supprimé. Téléchargements privés contrôlés et réponses no-store/nosniff ; prévisualisation contrôle le MIME réel. S3 est seulement configuré ; adaptateur distant et accès effectif non validés. Aucun transfert de fichiers effectué. Restent : quotas, expiration/purge temp, antivirus selon risque, sauvegardes/restauration et cohérence DB/fichiers lors des échecs.

AcademicAudit enregistre acteur/action/type/id/motif/data ; EnrollmentEvent couvre les décisions et notifications existent. Auditer les changements de permissions et la rétention ; ne pas journaliser mots de passe, tokens ou snapshots personnels complets. Le succès des tests ne remplace pas un audit complet OWASP ou un test d’intrusion.

Références de mécanismes : [Laravel 12 Authentication](https://laravel.com/docs/12.x/authentication), [Rate limiting](https://laravel.com/docs/12.x/rate-limiting). Les constats applicatifs ci-dessus proviennent du code local.

## Dépendances après remédiation

Composer final : aucun avis. npm `--omit=dev` : aucun avis. Audit npm complet : 13 avis modérés, propagés dans la chaîne ESLint/typescript-eslint par minimatch (aucun critique/élevé). Pas d’ignore ajouté et pas de mise à jour forcée incompatible.

L’avis [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) vise l’amplification de motifs contrôlés par un attaquant, avec optimizationLevel >= 2. Arbre inspecté : minimatch 3.1.5 via ESLint et 10.2.6 via typescript-estree. Dans ce dépôt, motifs/fichiers de lint proviennent du dépôt et de la configuration versionnée, pas d’un formulaire ou d’un endpoint utilisateur. Ce code ne fait pas partie des dépendances de production ; les jobs CI n’obtiennent pas les secrets de déploiement et le déploiement est séparé. Risque résiduel de développement retenu comme non bloquant pour la phase locale, à suivre lors d’une montée majeure coordonnée de l’outillage ; aucune promesse d’audit npm complet à zéro.

Swiper est passé à la branche 12 corrigée avec autorisation explicite, conformément à [GHSA-hmx5-qpq5-p643](https://github.com/advisories/GHSA-hmx5-qpq5-p643). Build et typage validés après mise à jour. Les erreurs historiques de mapping PSR-4 ont été remplacées par des includes de compatibilité vers les classes canoniques ; autoload strict sans avertissement.
