# Tests et performance

## Protocole

Baseline PHP réelle : 293 tests, 152 393 assertions. Les nouvelles preuves sont conservées sous `evidence/`. Les tests migrent une base SQLite `:memory:` isolée ; ils n'appliquent pas la migration à la base universitaire.

`tests/Feature/UniversityFinanceTest.php` vérifie monnaie exacte, non-rétroactivité, immutabilité, références rejouées, affectations multi-frais, dépassement et séparation des contextes, remboursement partiel/intégral, contre-affectations, plans et retards, pourcentages, promesses de tiers, versions de barèmes, CSV avec commit distinct, reçus figés/signés/privés, rôle et scope, séparation des devises, double contrôle et notification idempotente. Les parcours historiques de cartes, dossier et inscriptions complètent cette couverture.

`tests/Frontend/finance.test.mjs` rend la page financière : devises séparées, import sans confirmation implicite et absence de reçu payé pour un versement pending. Les tests frontend existants sont conservés.

Les assertions de rejeu séquentiel et les contraintes SQL ne constituent pas une preuve de concurrence PostgreSQL/MySQL. Les verrous SQLite ne reproduisent pas ceux de production. Aucune affirmation de test de paiement réellement simultané sur le moteur cible n'est faite.

## Requêtes et montée en charge

Listes : inscriptions 15/page, paiements 20/page, tarifs/aides/remboursements 15/page. Le détail calcule un seul contexte sélectionné. Les totaux sont agrégés en SQL, pas en hydratant tous les dossiers. Index ajoutés pour échéances par contexte/type/date, aides actives, affectations par obligation et remboursements par paiement/statut. Le relevé détaillé garde tout l'historique d'un contexte pour exactitude ; des historiques extrêmement volumineux nécessiteront profilage puis projection réconciliable.

Le nombre de lignes d'import est borné. Les exports streament les résultats agrégés et n'exposent pas un fichier de données personnelles complet. Aucune invalidation de cache de solde n'est nécessaire, car aucun cache monétaire persistant n'est ajouté.

`FinanceReportingService` utilise les chemins JSON du Query Grammar Laravel pour les échéances, avec plafond de 24 lignes. Vérifier plans d'exécution et résultats sur le moteur réel avant déploiement : les tests de cette phase exécutent SQLite, pas PostgreSQL ni MySQL.

Scénario k6 préparé : `scripts/load/finance.js`, lecture ou rejeu de confirmation/remboursement sur dossiers jetables de recette. Non exécuté ici. Il exige `TARGET_ENV=staging`, URL et sessions de test externes ; aucune session ni secret n'est livré. Vérifier avant/après nombre de paiements, demandes et audits avec un opérateur de recette.

Les **5 000 connexions simultanées ne sont pas validées**. Étapes restantes : copie anonymisée représentative, scénario multi-utilisateurs, PostgreSQL/MySQL réel, métriques p95/p99, conflits de verrous, CPU/mémoire, pool PHP/DB, sessions/cache/queue partagés, volumes d'exports et imports, absence de doublons et invariants de soldes. Le code livré prépare ces contrôles sans promettre une capacité non mesurée.

## Résultats vérifiés

| Vérification | Résultat |
|---|---|
| `php artisan test` | **310 tests réussis, 152 531 assertions**, 79,21 s |
| Baseline avant phase 06 | 293 tests réussis, 152 393 assertions |
| `npm run test:frontend` | **58 tests réussis**, aucun échec |
| `npm run types` | Réussi, code de sortie 0 |
| `npm run lint:check` | Réussi, code de sortie 0 |
| `npm run build` | Réussi, code de sortie 0 |
| `git diff --check` | Aucune erreur d'espacement |

Les [preuves PHP](evidence/final-php.txt), [frontend](evidence/frontend.txt), [types](evidence/types.txt), [lint](evidence/lint.txt) et [build](evidence/build.txt) sont conservées. Les 17 nouveaux tests PHP de finance complètent la baseline ; les contrôles du portail et des remboursements ont été ajoutés aux mêmes scénarios. Les scénarios de charge préparés n'ont pas été exécutés. Aucun test d'intégration avec un prestataire réel n'est revendiqué.
