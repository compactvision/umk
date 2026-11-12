# Rapport de phase 08

Le moteur de calendrier existant gère maintenant le référentiel des salles, les indisponibilités, les récurrences avec exclusions, les validations, les reports et annulations motivés. Le calendrier administratif, le planning étudiant et l’espace enseignant consomment les mêmes séances. L’appel peut être clôturé et corrigé sous contrôle. Une justification acceptée modifie la qualification du constat et alimente les rapports. Les décisions restent auditables et les pièces sont privées.

Les anciennes séances conservent leurs identifiants et leurs libellés. Leur rattachement à une salle du référentiel demande une décision explicite si la correspondance est ambiguë. Les règles de capacité sont appliquées aux salles identifiées. Campus et bâtiment sont décrits dans le référentiel des salles. Les équipements partagés n’ont pas leur propre moteur de réservation. Les modifications de groupe et d’enseignant passent par les workflows d’affectation existants. Le report d’une séance garde le contexte d’offre.

## Reprise et mise en service

1. Sauvegarder la base et le disque privé. Vérifier la restauration sur une copie.
2. Recenser les séances, appels et réservations publiées. Relever les anciens libellés qui désignent plusieurs salles.
3. Appliquer la migration additive `2026_11_10_110000_consolidate_academic_scheduling.php` sur une instance de recette. Vérifier les comptes et les références avant et après.
4. Renseigner les salles et tester les réservations, les rapports, les rôles et les justificatifs sur le moteur SQL cible. Appliquer les réglages de queue uniquement avec un worker validé.
5. Effectuer la recette de charge puis autoriser la mise en production.

Le retour automatique destructif du schéma est refusé. En cas de retour de code, conserver les nouvelles tables et préparer un export des historiques et des pièces avant toute évolution. La base universitaire et le déploiement n’ont pas été modifiés. La contention SQL et la capacité de 5 000 connexions restent à mesurer.

## Résultats vérifiés

| Contrôle | Résultat |
|---|---|
| Baseline PHP | 321 tests réussis, 152 713 assertions |
| Suite PHP séquentielle après build | 329 tests réussis, 152 845 assertions, 84,37 s |
| Suite frontend | 59 tests réussis |
| TypeScript, ESLint et build | Codes de sortie 0 |
| Diff et syntaxe du scénario k6 | Contrôles réussis |

La suite PHP finale a été exécutée seule sur SQLite en mémoire et avec le manifeste Vite stable. Deux exécutions PHP simultanées peuvent partager le disque des fixtures et perturber les tests de fichiers. Les preuves de la suite finale et des contrôles frontend sont conservées avec la baseline. Le scénario k6 a été vérifié syntaxiquement, sans essai de charge. [Preuves](evidence/)
