# Non-régression et performance

Baseline réelle : **310 tests PHP, 152 531 assertions**, SQLite en mémoire. Les nouvelles vérifications métier sont dans `tests/Feature/AcademicTeachingTest.php`. Les tests historiques n’ont pas été modifiés pour accommoder un échec.

Couverture : unicité du catalogue et historique des maquettes, crédits UE indépendants, option EC, offre contextualisée et rejouable, publication et archivage, retrait, prérequis officiel et dérogation, changement de groupe et séances historiques, conflit des assistants, permissions du compte enseignant et du personnel, fichiers privés, dépôts versionnés, diagnostic non mutant. Les suites existantes vérifient admissions, inscriptions, maquettes, finance, horaires, présence et résultats existants.

Pages : catalogue 25, offres 20, roster 20, historique équipe/inscriptions 15, ressources d’une fiche cours 25. Chargement anticipé des relations, requêtes limitées au niveau pour les EC, index d’audience et d’affectations, requête de conflit corrélée, synchronisation par lots. Les agrégats de liste n’hydratent pas tous les dossiers. Les anciennes pages de planification et d’appel conservent leur forme ; une pagination complète de tous les écrans hérités relève de la suite.

Cache de référence : `config/teaching.php`, 300 s, désactivable en mettant zéro. Seuls les instantanés EC/UE publiés et immuables sont mis en cache. Clé institution/année/programme/version/révision/niveau ; changement de révision/version change la clé. Le cache ne contient aucun étudiant, groupe, droit, fichier ou roster ; les permissions et rattachements sont relus. Les brouillons sont lus sans ce cache.

`scripts/load/academic-teaching.js` prépare la lecture par comptes de recette étudiant, enseignant et admin. Sessions externes, `TARGET_ENV=staging`, URL autorisée et aucun secret dans le dépôt. Le script n’a pas été exécuté contre une instance réelle. Les tests SQLite et les rejeux séquentiels ne démontrent pas la contention sur PostgreSQL/MySQL.

À mesurer avant montée en charge : p95/p99, requêtes et plans d’exécution, cache froid/chaud, ressources privées, latence des listes et écritures concurrentes (publication, affectation, changement de groupe, synchronisation). Le verrou du calendrier sérialise des écritures sensibles ; surveiller cette contention avant d’élargir le débit. **La capacité de 5 000 utilisateurs simultanés n’est pas validée.**

## Résultats vérifiés

| Vérification | Résultat |
|---|---|
| Baseline PHP | 310 réussis, 152 531 assertions |
| `php artisan test` après build | **321 réussis, 152 713 assertions**, 47,48 s |
| `npm run test:frontend` | **59 réussis**, aucun échec |
| `npm run types`, `npm run lint:check`, `npm run build` | Codes de sortie 0 |
| `git diff --check` | Aucune erreur d’espacement |

Les preuves sont conservées dans [evidence](evidence/). Les onze nouveaux scénarios PHP et le test frontend de la fiche cours s’ajoutent aux assertions historiques. Exécuter le build avant la suite PHP : le test des en-têtes lit le manifeste Vite, qui est temporairement absent pendant sa reconstruction. Aucun test de charge ni migration réelle n’a été exécuté.
