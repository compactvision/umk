# Charge et benchmark HTTP

Un smoke k6 a utilisé un serveur local lié à loopback, une base SQLite jetable, un compte synthétique et une seule instance PHP. La passe sur le build compilé compte 43 requêtes sans erreur, dont le refus CSRF attendu. Le p50 est de 50,69 ms, le p95 de 94,52 ms, le p99 de 488,71 ms et le débit de 6,07 requêtes par seconde sur environ sept secondes. Cette mesure inclut le démarrage de session et ne démontre pas la capacité cible. [Journal](evidence/k6-local-smoke.txt)

| Parcours | Script de recette |
| --- | --- |
| Navigation et pic de résultats | `student-journey.js`, modes `mixed` et `results` |
| Réinscriptions et progression | `enrollment-management.js` et `academic-progression.js` |
| Bulletins, attestations, QR et cartes | `academic-results.js` et `official-documents.js` |
| Dépôts et corrections | `assessments.js` |
| Finance et administration | `finance.js`, `admissions.js`, `academic-results.js` et `official-documents.js` |

Préparer un compte distinct par VU avec données synthétiques, des résultats et archives publiés, des devoirs ouverts et des dossiers administratifs jetables. Exécuter une montée 100, 500, 1 000, 2 500 puis 5 000 VU avec des pauses de lecture représentatives. Ajouter pic et endurance. Mesurer p50, p95, p99, débit, octets, erreurs, CPU, mémoire, I/O, connexions et retard de file. Contrôler les doublons, pertes de dépôt et accès croisés dans la base après les écritures.

Les cibles initiales sont p95 inférieur à 500 ms pour les lectures API simples, inférieur à 1 s pour les écritures usuelles et erreurs techniques sous 0,5 %. Lancer les pannes Redis, stockage, worker ou service externe uniquement sur une recette isolée. Les paliers, les cibles et les essais de résilience sous charge restent à exécuter.
