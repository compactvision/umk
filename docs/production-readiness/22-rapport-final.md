# Rapport final de la phase 14

| Volet | Résultat |
| --- | --- |
| État initial | Monolithe Laravel/Inertia dans un arbre de travail déjà modifié. Baseline de 359 tests PHP. [Audit](01-audit-global.md) |
| Corrections | Regroupement des règles d’accès et des lectures financières, limitation des données du portail par section et reconstruction du schéma historique dans le test de migration. |
| Sécurité | Politique de référent privée, protection contre le cadrage intersite et contrôle des cookies avant production. Déploiement manuel via l’environnement GitHub `production`. [Risques et contrôles](03-audit-securite.md) |
| Performance | Accueil étudiant de 144 à 93 requêtes SQL. Smoke local à un utilisateur et 43 requêtes. Les mesures ne valident pas 5 000 utilisateurs. [Comparatif](07-laravel-performance.md) · [Charge](13-tests-charge.md) |
| Infrastructure | PostgreSQL 16 et Redis local exercés en environnement jetable. Les composants et paramètres de production restent à confirmer. [Dimensionnement](14-dimensionnement-infrastructure.md) |
| Qualité | 364 tests PHP, 59 tests frontend, 162 tests PostgreSQL et sept scénarios de concurrence. [Rapport de tests](12-strategie-tests.md) |
| Exploitation | Sonde d’exécution et journal HTTP ciblé. Restauration conjointe de la base et d’un fichier synthétique avec contrôle d’empreinte. [Restauration](17-sauvegardes-restauration.md) · [Déploiement](16-deploiement-rollback.md) |
| Verdict | **NO-GO production.** Exploitation et charge cible à valider sur une recette représentative. [Justification et registre des risques](21-rapport-go-no-go.md) |
| Suite | Confirmer les services, exercer la restauration cible, mesurer les paliers et signer la recette. [Checklist](20-checklist-release.md) |

La documentation conserve les mesures brutes et distingue les opérations réalisées des exercices préparés. La migration de l’environnement de production, l’activation d’une release et les tests sur des données réelles restent hors des opérations exécutées.
