# Clôture et feuille de route après phase 01

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

## Décision de passage

**Phase 01 validée dans le périmètre local disponible, sans défaut critique confirmé restant ouvert dans ce périmètre.** Les corrections, contrôles et limitations sont traçables dans les sept rapports et evidence/. La phase 02 peut commencer sur cette base ; cette décision n’autorise ni déploiement ni charge massive en production.

## Réserves initiales levées

- Tests : 229/229 SQLite ; 87 intégrations PostgreSQL et 2 tests concurrents PostgreSQL.
- Typage : erreurs historiques corrigées, contrats LevelDetails/AdmissionCondition, compatibilité React et FormData ; prototypes dormants consolidés en réexports, aucune route active supprimée.
- Qualité frontend : lint sans erreur ni avertissement, 51 tests et build réussis, aucun affaiblissement des règles de vérification.
- Dépendances : correctifs compatibles, plateforme Composer PHP 8.2, firebase/php-jwt 7 et Swiper 12 autorisés ; zéro avis Composer et npm de production.
- Authentification : sessions, CSRF logout, tokens, reset non rejouable, email sensible et OAuth vérifié ; compteur protégé par verrou et tests de durée.
- Documents : propriétaire temp, MIME, échec stockage, transaction brouillon, compensation et nettoyage après commit.
- Finance : concurrence confirmée sur deux connexions, un seul effet et une seule trace par confirmation.
- Déploiement : clé stable, tests requis avant déploiement, workers/healthcheck/retour release précédente préparés et contrôles HTTP testés localement.
- Charge : script k6 vérifié à un utilisateur avec cookies, version Inertia et CSRF ; paliers 100–5000 préparés.

## Travaux non bloquants de suivi

| Priorité | Suivi | Condition de réalisation |
|---|---|---|
| Avant production | Sauvegarde et restauration, topologie réelle PHP/FPM/DB, stockage privé et workers | Accès serveur et autorisation explicite ; aucune preuve inventée |
| Avant engagement 5000 | Campagne graduée k6 et métriques CPU/RAM/DB/queues | Infrastructure représentative, comptes isolés, autorisation de charge |
| P2 | 13 avis modérés de développement liés à minimatch | Montée coordonnée d’ESLint et plugins ; pas de contournement d’audit ni changement majeur non validé |
| P2 | Down historique enrollments et autres rollbacks de schéma | Tests sur copie et procédure approuvée ; aucune exécution destructive sur la base réelle |
| P2 | SQL : factorisation des décisions d’accès et agrégations par requête, pagination d’historiques | Mesure du nombre et du coût SQL avant optimisation ou index |
| P2 | Jobs métier différables et supervision | Workers opérationnels, idempotence/retry/timeout et garanties après commit |
| P2 | Rôles professor/staff/manager/super admin et périmètre facultaire | Décision métier explicite, tests de droits ; aucun nouveau moteur de permissions |
| P2 | Matrice navigateur, accessibilité et services OAuth/mail/S3 réels | Environnement d’intégration autorisé et comptes de test |

## Préparation de phase 02

Conserver les identifiants Faculty/Level/Courses/AcademicYear/AcademicOffering et les relations académiques/financières. Auditer ces référentiels avant toute migration additive. L’extension single-university et les maquettes versionnées du cahier des charges phase 02 constituent un chantier distinct ; aucune règle de notes, délibérations ou diplômes n’a été anticipée pendant cette clôture.

Aucun commit, push, modification de serveur ou réinitialisation de base existante réalisé. Les trois fichiers frontend déjà modifiés à l’ouverture conservent le travail utilisateur ; les corrections ciblées ultérieures de sidebar ne suppriment pas sa navigation.
