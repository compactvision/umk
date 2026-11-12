# Rapport final de la phase 10

Les activités nouvelles conservent les points d’entrée du cours et du portail. La configuration ajoute un cycle de publication et de correction, une composition de groupe figée, les examens liés au planning et une transmission versionnée des corrections validées. Les devoirs, résultats personnels, identifiants et chemins historiques sont conservés. `php artisan academic:assessment-audit --details` permet d’inventorier les activités historiques en lecture seule avant toute reprise manuelle.

L’espace enseignant et le back-office donnent accès à la liste, aux participants, aux copies et aux corrections. Le portail présente les remises, leurs versions, les situations de participation et le feedback privé. La phase 11 demeure responsable des calculs officiels et des délibérations.

Les examens numériques chronométrés, les rappels automatiques, les traitements médias et la consolidation officielle sont hors du périmètre livré. Le moteur SQL de production, les travailleurs de notification et la capacité à 5 000 connexions restent à qualifier en recette.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| PHP avant intervention | 339 tests et 153 112 assertions. [Baseline](evidence/baseline.txt) |
| PHP après intervention | 347 tests et 153 378 assertions. [Suite complète](evidence/php-final.txt) |
| Vérification ciblée | 9 tests et 275 assertions. [Dépôts et workflow](evidence/workflow.txt) |
| Frontend | 59 tests réussis. [Sortie](evidence/frontend.txt) |
| Compilation, TypeScript et ESLint | Réussis |
| Scénario k6 et diff | Syntaxe JavaScript et `git diff --check` validés |

La migration a été exercée sur SQLite en mémoire. Les scénarios k6 restent à exécuter en recette avec des comptes et dossiers jetables.
