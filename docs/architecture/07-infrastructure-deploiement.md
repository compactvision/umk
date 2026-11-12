# Infrastructure, déploiement et observabilité

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

## État vérifié et état inconnu

| Élément | Dépôt / local observé | Production |
|---|---|---|
| DB | Config SQLite/MySQL/PostgreSQL ; .env local MySQL ; tests SQLite | Moteur, taille et pool inconnus |
| Redis | Config database/cache/session/queue disponible | Connexion, mémoire, persistance, haute disponibilité non vérifiées |
| Queues | database par défaut local, tables jobs/failed_jobs, queue:listen dans composer dev | Worker/superviseur et latence inconnus |
| Horizon | Pas de dépendance Laravel Horizon | Ne pas installer sans Redis et capacité opérationnelle |
| Stockage | Local privé/public + config S3 | Permissions, sauvegardes, S3 effectif inconnus |
| Santé | /up Laravel ; app:preflight key/db/assets | Endpoint externe et alerte non testés |
| Déploiement | GitHub Actions Nitrohost + .cpanel.yml | Chemin réellement utilisé et exécutions non vérifiés |

## CI inspectée et modification locale

tests.yml : Node 22, PHP 8.4, npm ci/build, composer install, clé de test puis PHPUnit. Ajout d’un job isolé PostgreSQL 16 / PHP 8.2 avec pdo_pgsql, healthcheck service et suites de sécurité/admission/étudiant/planification ; identifiants jetables du service CI uniquement. Il ne configure aucun serveur de production. Les suites équivalentes ont été exécutées sur PostgreSQL Docker local ; la CI distante n’a pas été déclenchée. La suite complète locale est désormais verte.

lint.yml utilise désormais permissions contents:read, npm ci, contrôle de syntaxe PHP et lint sans mutation. Le workflow tests installe Composer avant les contrôles TypeScript (Ziggy), exécute typage/lint/tests frontend, build, audit Composer et audit npm production. Aucun reformatage automatique ni commit CI.

## Déploiement

GitHub deploy.yml : PHP 8.2 (pdo_mysql), Node 22, build no-dev, transfert release, liens .env/storage partagés, preflight, caches, migrate --force, lien current, conservation cinq releases. Le déploiement dépend maintenant du workflow de tests réutilisable et sérialise les déploiements concurrents. Après bascule, queue:restart est demandé et app:preflight --http contrôle /up ; en cas d’échec, le lien revient à la release précédente si disponible, sans rollback destructif de schéma. Aucun mécanisme de sauvegarde serveur n’a été prouvé : il reste un prérequis opérationnel avant production. `ln -sfn` seul ne prouve pas une bascule sans interruption ni rollback automatique. Les migrations sont exécutées avant bascule et exigent compatibilité ancienne/nouvelle release.

`.cpanel.yml` régénérait APP_KEY systématiquement : correction locale vers app:preflight --production ; la clé doit être restaurée/provisionnée hors déploiement et rester constante. Aucune clé réelle modifiée. Ce fichier comporte aussi chmod étendu et build tardif ; confirmer s’il est réellement exploité avant toute adaptation majeure. Conserver une seule procédure de déploiement opérationnelle documentée.

## Runbook proposé avant prochaine production

1. Inventorier plateforme, versions PHP/extensions, moteur DB, stockage et workers ; sauvegarder DB, clé et fichiers avec restauration testée.
2. Faire passer tests et triage dépendances ; préparer release et migrations compatibles ; maintenance contrôlée si incompatibilité.
3. Preflight --production --database --assets ; cookies HTTPS et reverse proxy corrects ; aucun secret imprimé.
4. Appliquer migrations compatibles, basculer release, redémarrer workers supervisés et vérifier /up plus parcours synthétique autorisé ; vérifier connexion DB/stockage séparément.
5. Revenir à la release précédente si échec applicatif, en gardant schéma compatible ; restauration DB uniquement selon procédure validée, jamais migrate:rollback aveugle sur historiques financiers.

Aucune étape serveur exécutée. Tout changement réel de serveur ou secrets exige autorisation.

## Dimensionnement et supervision à établir

Mesurer RSS worker PHP pour dimensionner pm.max_children à partir de la RAM disponible ; ne pas confondre 5000 étudiants avec 5000 processus FPM. Configurer Nginx limites upload et timeouts cohérents avec PHP, gzip/brotli et assets fingerprintés, logs latence sans corps sensibles. Sessions/cache partagés avant plusieurs instances ; stockage partagé privé ; pool PostgreSQL éventuel après mesure connexions et compatibilité transactions. CDN réservé aux contenus publics.

Collecter erreurs 5xx, P50/P95/P99 par route, SQL lent et locks, FPM active/idle/wait, connexions DB, CPU/RAM/disque, échecs storage et queue wait/failed_jobs. Corréler identifiant de requête sans PII. Laravel logs/Audit existent mais pas de plateforme centralisée démontrée. Proposer alertes >1 % 5xx sur 5 min, worker indisponible et saturation DB ; attribuer un responsable et un runbook avant installation d’outils supplémentaires.

## Fin de vérification locale

Docker Desktop démarré avec autorisation pour le PostgreSQL jetable ; aucun accès à MySQL existant. Aucun Redis activé dans l’application : les drivers locaux observés restent database, et aucune obligation Redis/Horizon n’a été introduite. PostgreSQL et k6 ont été testés localement ; les vérifications de serveur, sauvegarde/restauration et supervision exigent toujours un environnement réel. La phase locale n’atteste pas ces opérations externes.
