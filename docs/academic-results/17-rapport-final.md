# Rapport de la phase 11

Les résultats personnels publiés, les résultats d’UE manuels et leurs fichiers historiques sont conservés. Les corrections pédagogiques validées alimentent des résultats d’EC, d’UE, de période et d’année dans la maquette concernée. La préparation, les décisions de jury, l’approbation, la publication et la rectification utilisent des éditions distinctes et traçables.

Les autorisations et seuils dépendent d’un règlement approuvé pour chaque périmètre. Les valeurs des tests sont fictives. Les rôles métier doivent être attribués par l’établissement. Les choix institutionnels restant à préciser comprennent les règlements applicables, les modèles et signatures de documents, les recours exceptionnels, les modalités de convocation au rattrapage et les règles de consolidation pluriannuelle. Les imports en masse de notes restent différés.

Les PDF de vérification utilisaient des données fictives. Un bulletin de trois pages et un procès-verbal de trois pages ont été rendus et inspectés, avec en-têtes répétés et pagination. La capacité à 5 000 utilisateurs, les verrous sur le moteur SQL cible et les travailleurs de recette restent à mesurer.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| PHP avant intervention | 347 tests réussis, 153 378 assertions. [Baseline](evidence/baseline.txt) |
| PHP après intervention | 351 tests réussis, 153 533 assertions. [Suite complète](evidence/php-final.txt) |
| Frontend | 59 tests réussis. [Sortie](evidence/frontend.txt) |
| Compilation, TypeScript et ESLint | Réussis |
| Scénario k6 et diff | Syntaxe JavaScript et `git diff --check` validés |

Le scénario intégré a calculé 12,80 à partir des corrections validées, puis 13,20 après rectification. Il a vérifié le quorum, les autorisations, le recours, la référence de progression et la conservation du PDF initial. Le test de génération PDF s’exécute dans un processus séparé pour libérer la mémoire avant la suite des tests de téléversement.

Les migrations ont été exercées sur SQLite en mémoire. Les scénarios de charge et les validations sur le moteur SQL cible restent à exécuter en recette.
