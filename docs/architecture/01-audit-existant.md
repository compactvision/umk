# Phase 01 — Audit de l’existant

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

Date : 4 novembre 2026. Périmètre : dépôt local, sans accès au serveur ni modification des secrets. **Validation locale acquise après levée des réserves bloquantes** ; production non examinée. Les résultats ci-dessous distinguent observation, correction et recommandation.

## Baseline avant modification

- Git : trois fichiers déjà modifiés : `resources/js/components/layouts/Dashboard/Sidebar.tsx`, `resources/js/components/student/navigation.ts`, `resources/js/pages/dashboard/student/Portal.tsx`. Conservés sans intervention.
- PHP local 8.4.17 ; Node 24.13.1. Déploiement déclaré PHP 8.2 / Node 22 ; CI historique PHP 8.4. Compatibilité PHP 8.2 non exécutée localement.
- `php artisan test` : 187 réussites, 22 échecs, 150402 assertions, 44,73 s.
- `npm run types` : 349 erreurs TypeScript dans la sortie complète initiale. Le premier compte rendu avait été établi avant la fin du processus et indiquait à tort un succès ; cette erreur est corrigée. `npm run build` : succès, 8,19 s ; bundle principal 383,09 kB / 124,23 kB gzip. Ce build inclut les modifications locales préexistantes ; ce n’est pas un test fonctionnel.
- `npx eslint .` sans correction : 86 erreurs, 5 avertissements ; aucun lint automatique appliqué. `node --test tests/Frontend/*.test.mjs` : 51 réussites.
- `.env` local : MySQL, cache/queues/sessions database, disque local. Ce choix ne décrit pas la production. Aucune valeur confidentielle reproduite.

## Diagnostic priorisé établi avant les corrections

| ID | Gravité | Preuve / fichier | Impact | Traitement |
|---|---|---|---|---|
| SEC-01 | Critique | `app/Modules/Site/Infrastructure/Http/Routes/api.php` : POST et PUT sans authentification | Modification publique du site et uploads publics | Ajout web (session/CSRF), auth, verified, rôle admin ; GET public conservé |
| SEC-02 | Élevée | `SaveProgressUseCase.php` : lit un chemin temp fourni par le client sans propriétaire | Appropriation d’un autre upload si son chemin est connu | Uploads dans un préfixe utilisateur ; refus avant mutation des chemins étrangers, traversées et fichiers absents |
| SEC-03 | Élevée | `CacheLoginRateLimiter.php` : TTL 60 secondes pour verrouillage annoncé 15 minutes | Contournement du verrouillage après une minute | Expiration à une heure ; normalisation de la clé email |
| SEC-04 | Élevée | `AuthController.php` : logout sans invalidation du contenu session ; erreurs distinctes utilisateur absent/mot de passe | Données de session résiduelles et énumération textuelle | Invalidation, rotation CSRF, erreur uniforme ; régénération session login/register/OAuth |
| OPS-01 | Élevée | `.cpanel.yml` : `key:generate --force` à chaque déploiement | Perte des données chiffrées et invalidation des cookies | Remplacé par preflight ; clé provisionnée séparément |
| DATA-01 | Élevée | `SubmitEnrollmentUseCase.php` : transaction sans verrou du dossier | Deux soumissions peuvent attribuer deux matricules / envoyer deux confirmations | Lecture `lockForUpdate`, email après commit ; concurrence réelle PostgreSQL encore à tester |
| QA-01 | Moyenne | `User::factory()` absent ; factory utilise une colonne `name` inexistante | Nombreux tests échouent avant le comportement testé | HasFactory et champs first_name/last_name ; contrats auth actualisés |
| QA-02 | Moyenne | Tests `/confirm-password`, `/settings/*` ; fichiers routes non inclus | Dix tests historiques ne correspondent pas au produit actif | Scénarios remplacés par les parcours actifs, avec assertions de sécurité ; pas de réactivation de suppression de compte |
| CFG-01 | Faible | Deux clés `private` dans `config/filesystems.php` | Première définition silencieusement écrasée | Doublon supprimé, racine conservée |
| PERF-01 | Moyenne | `AcademicAccessService::permissions()` appelle decision pour chaque feature, finance répétée | Coût SQL multiplié sur une seule page | Mesurer puis factoriser par requête ; pas de cache privé global |
| AUTH-01 | Élevée à qualifier | `SocialLogin.php` rapproche uniquement par email | La sécurité dépend de l’email vérifié du fournisseur | Contrat fournisseur, liaison explicite et tests à compléter avant activation OAuth en production |

## Audit des dépendances

Exécutés avec accès réseau après premier échec DNS du sandbox : `composer audit --locked --format=json` et `npm audit --json`. Résultats bruts dans `evidence/`, à la date de l’audit. Composer : 54 avis sur 15 paquets, dont un critique pour Laravel. npm : 24 paquets signalés (3 critiques, 15 élevés, 5 modérés, 1 faible). Un avis n’établit pas à lui seul l’exploitabilité d’un parcours ; il impose un triage par version et usage. Les verrouillages ont ensuite été actualisés et vérifiés. Cette réserve initiale a été levée : Laravel 12.71.0, Socialite 5.30.0, firebase/php-jwt 7.2.1 et les autres correctifs sont installés ; Composer final ne signale aucun avis. Swiper 12 corrige le dernier avis critique npm. Les seuls changements majeurs par rapport aux dépendances initiales sont firebase/php-jwt et Swiper, explicitement autorisés. Composer résout sous une plateforme PHP 8.2.0 pour préserver la compatibilité déclarée. Les 13 avis npm modérés restants concernent uniquement l’outillage de développement ; voir 03. Ne pas utiliser `audit fix --force`.

## Ordre d’intervention et résultat

1. Compréhension routes/providers/configurations et baseline.
2. Identification des preuves et priorisation ci-dessus.
3. Corrections limitées : accès site, uploads, sessions, verrouillage, clé, soumission.
4. Tests sécurité ciblés puis suite complète ; aucune assertion désactivée et aucun test ignoré pour masquer un échec.
5. Documentation, préparation PostgreSQL et k6 ; aucune exécution de charge.

Les notes structurées, coefficients, délibérations, bulletins et recours avancés n’ont pas été implémentés. Aucun commit, push, déploiement, réinitialisation de base ou migration de documents.

## Consolidation des interfaces dormantes

L’analyse complète TypeScript a révélé des prototypes non utilisés par les routes actives, parfois associés à des imports de fichiers vides. Les anciens points d’entrée Faculty/FacultyShow/LevelShow/Professor et certains composants Blog ont été conservés sous forme de réexports vers les pages canoniques déjà en service. Aucun contrôleur actif ni nom de route n’a été supprimé. Les anciens corps restent consultables dans Git. Les composants actifs disposent maintenant de contrats typés (notamment LevelDetails/AdmissionCondition) ; aucun contrôle TypeScript n’a été désactivé, aucun any ajouté pour masquer les erreurs. Les modifications frontend préexistantes de l’utilisateur ont été conservées et seuls des ajustements ciblés de typage/hooks ont été appliqués à la sidebar.
