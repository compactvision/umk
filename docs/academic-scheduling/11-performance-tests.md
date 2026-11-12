# Performance et vérifications

La baseline a réussi 321 tests PHP et 152 713 assertions. Les huit scénarios `AcademicSchedulingTest` couvrent le référentiel, la capacité, l’indisponibilité, le rejeu de série, les exclusions, l’historique de report, le retour arrière d’un conflit, l’appel enseignant, la clôture, les corrections et les justificatifs privés. Les anciennes assertions de suppression de séance publiée et de génération répétée ont été remplacées par le nouveau contrat métier. Le test de suppression d’un brouillon conserve ses vérifications. L’édition future est testée avec une horloge déterministe.

Les calendriers chargent une fenêtre de semaine. L’appel, les dossiers de justification, les ressources, les rapports et l’historique utilisent une pagination. Les rapports agrègent en SQL et streament le CSV par lots. Les index ciblent les plages par salle et offre, les indisponibilités et le lien de présence. Les références et les audiences sont chargées dans leur contexte. Les permissions et les créneaux sont lus en temps réel, sans cache partagé de données privées. Les notifications peuvent être confiées au worker Laravel.

`scripts/load/academic-scheduling.js` fournit des profils de lecture et des scénarios de rejeu pour génération, publication, report et appel. Il exige `TARGET_ENV=staging`, une URL autorisée et un fichier de sessions et données jetables fourni hors dépôt. Les réponses métier ne suffisent pas à valider les invariants sous charge. Contrôler le nombre d’occurrences, de reports et de lignes d’appel après les essais.

Aucun résultat de charge à 5 000 connexions n’est revendiqué. La recette doit vérifier plans SQL, p95/p99, volume d’export et de notifications, contention du verrou de calendrier et tentatives concurrentes sur le moteur cible. SQLite ne démontre pas la concurrence PostgreSQL.

## Résultats vérifiés

| Contrôle | Résultat |
|---|---|
| Baseline PHP | 321 tests réussis, 152 713 assertions |
| Suite PHP séquentielle après build | 329 tests réussis, 152 845 assertions, 84,37 s |
| Suite frontend | 59 tests réussis |
| TypeScript, ESLint et build | Codes de sortie 0 |
| Diff et syntaxe du scénario k6 | Contrôles réussis |

La suite PHP finale a été exécutée seule sur SQLite en mémoire et avec le manifeste Vite stable. Deux exécutions PHP simultanées peuvent partager le disque des fixtures et perturber les tests de fichiers. Les preuves de la suite finale et des contrôles frontend sont conservées avec la baseline. Le scénario k6 a été vérifié syntaxiquement, sans essai de charge. [Preuves](evidence/)
