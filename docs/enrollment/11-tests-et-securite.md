# Tests exécutés

Baseline phase 04 : 269 réussis et 3 échecs. Baseline phase 05 après consolidation : 276 réussis, preuve `evidence/baseline.txt`.

Tests nouveaux : `StudentManagementTest` et `AcademicEnrollmentManagementTest`. Ils couvrent permissions séparées, périmètre de faculté, refus étudiant, recherche, pagination de lectures, absence de requêtes lourdes dans le résumé, demandes, sécurité du compte, congé/reprise, états terminaux, idempotence, conflit de clé et refus des formulaires périmés, capacité des groupes, refus de clôture prématurée, réouverture contrôlée, transfert atomique et conservation des écritures, propriété de l’historique étudiant, refus d’activation sur année fermée.

Les assertions de versionnement de `AcademicStructureTest` sont conservées ; le test de clôture prépare désormais un contexte terminé et transmet un motif, conformément aux nouvelles préconditions. Le scénario de démonstration préserve son catalogue volontairement inactif via une option interne explicite d’import historique.

Le test frontend d’accueil était obsolète : dépendances TypeScript non résolues et ancien ordre visuel. Son chargeur exécute maintenant les véritables utilitaires de dates et composant de périodes, avec des données de semaine valides. Les assertions de confidentialité financière et pédagogique sont conservées. **51 tests frontend réussis** lors de la première validation corrigée.

Les résultats finaux PHP, TypeScript, lint, frontend et build sont enregistrés dans `evidence/`. Seules les commandes réellement exécutées y sont rapportées. Aucun résultat PostgreSQL ou test à 5 000 connexions n’est revendiqué pour cette intervention.

## Première validation du 7 novembre 2026 (avant reprise)

| Commande | Résultat | Preuve |
|---|---|---|
| `php artisan test` | **284 réussis, 0 échec**, 152 188 assertions, 69,95 s | [PHPUnit](evidence/phpunit.txt) |
| `npm run test:frontend` | **51 réussis, 0 échec** | [Frontend](evidence/frontend.txt) |
| `npm run types` | Réussi | [TypeScript](evidence/typescript.txt) |
| `npm run lint:check` | Réussi, aucune erreur | [ESLint](evidence/eslint.txt) |
| `npm run build` | Réussi, 8,01 s | [Vite](evidence/build.txt) |
| `git diff --check` | Réussi | Contrôle exécuté sur l’arbre de travail |

Vite signale aussi des images statiques existantes non résolues à la compilation ; le build aboutit, mais ces avertissements ne constituent pas une validation visuelle des assets de déploiement. Aucun test de charge n’a été exécuté. Les tests PHP utilisent SQLite en mémoire ; les garanties de verrouillage concurrent sur PostgreSQL restent à mesurer sur recette.

## Validation de reprise

Baseline : 284 tests réussis, 152 188 assertions, 68,29 s. Les nouvelles preuves sont conservées séparément dans `evidence/reprise/`.

`EnrollmentManagementFollowupTest` vérifie les filtres académiques et promotions, la confidentialité vis-à-vis d’un accès financier seul, le refus des affectations périmées au même statut, l’idempotence des décisions sans modification, la résolution atomique d’une demande propriétaire, le cloisonnement des motifs internes, la réinscription depuis la page annuelle et la conservation du matricule, les horaires avant/après changement de groupe et département, le refus des anciennes ressources, la réorientation au même niveau avec conservation du grand livre et des résultats, l’unicité du contexte réservé, l’upgrade du schéma avec données préexistantes, la reprise d’anciennes décisions de transfert, le refus de rollback et le contrôle de capacité/périmètre.

`tests/Frontend/enrollment-management.test.mjs` vérifie la navigation annuelle, les liens vers les demandes existantes, l’affichage des conditions et promotions, l’absence de demande de réinscription sans décision, et le lien vers une cible déjà créée. Aucun test de charge ou de capacité à 5 000 utilisateurs n’est revendiqué.

### Résultats finaux de reprise

| Commande | Résultat | Preuve |
|---|---|---|
| `php artisan test` | **293 réussis, 0 échec**, 152 393 assertions, 74,76 s | [Suite complète](evidence/reprise/phpunit.txt) |
| `npm run test:frontend` | **54 réussis, 0 échec** | [Frontend](evidence/reprise/frontend.txt) |
| `npm run types` | Réussi | [TypeScript](evidence/reprise/typescript.txt) |
| `npm run lint:check` | Réussi, aucune erreur | [ESLint](evidence/reprise/eslint.txt) |
| `npm run build` | Réussi, 8.23 s | [Vite](evidence/reprise/build.txt) |
| `git diff --check` | Réussi | Contrôle exécuté |

Le scénario ciblé d’upgrade et de compatibilité est également conservé dans [upgrade-targeted.txt](evidence/reprise/upgrade-targeted.txt). Les contrôles PHP utilisent exclusivement la base jetable SQLite en mémoire. Les migrations 140000 et 150000 sont prêtes mais non appliquées à une base réelle ; le [plan d’application](02-modele-inscription-annuelle.md) requiert une validation préalable. Le build conserve les avertissements d’images statiques déjà signalés ; aucune capacité à 5 000 utilisateurs n’est certifiée.
