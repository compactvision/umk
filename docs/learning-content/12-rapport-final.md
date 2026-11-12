# Rapport de la phase 09

Les supports sont organisés sur les offres existantes. Les enseignants habilités disposent d’une bibliothèque de préparation et de publication. Les étudiants retrouvent les ressources autorisées dans les cours, les séances et les travaux. L’administration supervise les statuts, les versions et la disponibilité des fichiers dans son périmètre.

La migration est additive. Elle conserve les références de stockage et ne déplace pas de fichiers. La restauration du code précédent peut conserver le schéma étendu, mais doit être préparée en recette pour tenir compte des publications et des éditions réalisées après la bascule. Une suppression du schéma exige un plan d’export et de conservation des versions.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| PHP avant modification | 329 tests réussis, 152 845 assertions. [Sortie initiale](evidence/baseline.txt) |
| PHP après modification | 339 tests réussis, 153 112 assertions. [Sortie finale](evidence/php-final.txt) |
| Frontend | 59 tests réussis. [Sortie](evidence/frontend.txt) |
| Compilation, TypeScript et ESLint | Réussis |
| Scénario k6 et contrôle de diff | Syntaxe JavaScript et `git diff --check` validés |

Les tests couvrent le cycle de publication, les droits par rôle et par offre, l’inscription pédagogique, le remplacement d’un support historique, les contrôles de fichiers, la lecture partielle, les pièces complémentaires, le périmètre facultaire et la notification facultative.

Les migrations ont été exercées sur SQLite en mémoire dans les tests. Le stockage objet, les workers de recette et la capacité à 5 000 connexions restent à vérifier sur l’infrastructure cible.
