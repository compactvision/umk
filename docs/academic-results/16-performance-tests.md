# Performance et recette

La liste des dossiers et l’historique utilisent la pagination serveur. Les préparations et revérifications lisent les inscriptions et corrections par lots. La publication est atomique par dossier de jury. Le stockage privé réutilise les PDF archivés après la première émission. Les contrôles d’accès sont recalculés sur chaque requête. Le calcul, l’approbation, la publication et la première génération restent synchrones. Mesurer les temps de verrouillage et le coût des grands procès-verbaux sur le moteur cible avant de planifier des travaux en file.

Le script `scripts/load/academic-results.js` propose `results` à 1 000 VU, `peak` à 2 500 et `mixed` à 5 000, ainsi que `bulletin`, `export`, `prepare` et `publish`. Ce sont des cibles, dont les volumes sont modifiables.

```sh
k6 run -e TARGET_ENV=staging -e BASE_URL=https://recette.example \
  -e MODE=results -e TARGET_VUS=20 \
  -e ACCOUNTS_FILE=/chemin/prive/results-sessions.json scripts/load/academic-results.js
```

Utiliser uniquement des sessions et dossiers jetables. Les modes d’écriture exigent `ALLOW_WRITES=disposable`, des dossiers distincts, un jeton CSRF et une charge utile conforme à la route. Les modes de lecture nécessitent les identifiants appropriés parmi `academic_id`, `reference` et `run_id`.

Les jeux de test se trouvent dans `OfficialResultCalculatorTest` et dans le scénario officiel d’`AcademicTeachingTest`. Le calcul manuel de référence utilise 14 et 12 pondérés à 40 et 60 pour obtenir 12,80. Les tests traitent aussi les crédits, la compensation, le rattrapage, les absences, les documents et les recours.
