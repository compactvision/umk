# Tests et validation locale

La phase 01 avait établi 229 tests SQLite, 87 intégrations PostgreSQL 16, deux tests concurrents et 51 tests frontend réussis. La phase 02 ajoute 15 tests fonctionnels (dont une migration sur données témoins) et quatre scénarios concurrents.

| Contrôle | Résultat local |
|---|---|
| Suite SQLite | 244 tests réussis, puis rejeu des deux scénarios renforcés |
| Intégration PostgreSQL 16 | 102 tests réussis, puis rejeu des deux scénarios renforcés |
| Concurrence PostgreSQL 16 | 6 tests réussis : unicité de publication, conflits d'édition, codes, rattachement, matricules et paiements |
| TypeScript, ESLint, frontend, Vite | Typage et lint réussis, 51 tests frontend réussis, build de production réussi |
| Autoload Composer | PSR-4 strict réussi |
| Navigateur local | Connexion admin fictive, ouverture directe d'une maquette, enregistrement d'un brouillon, validation motivée, publication, lecture seule, rattachement motivé et vérification du dossier déplacé dans la liste |

Les tests couvrent les cycles non LMD, les niveaux existants, les permissions et les identifiants d'une autre institution. Ils vérifient l'année ou la cohorte applicable, l'immutabilité des versions et des crédits historiques, l'absence de réattribution lors d'un remplacement, le contrôle des choix d'admission et la préservation des IDs d'offres, d'horaires, de ressources et de paiements. Les tests de calendrier et les suites de la phase 01 ont été rejoués avec la structure additive.

| Critères de clôture | Preuves |
|---|---|
| Structure documentée et extensible | [Audit](01-audit-existant.md), [diagramme des tables](erd.md), [stratégie multi-universités](06-strategie-multi-universites.md) |
| Continuité des facultés, niveaux, programmes et années | `AdminAppsTest`, `AcademicStructureTest`, `ScheduleModuleTest` |
| Cycle de vie, droits, immutabilité et rattachements | `AcademicStructureTest`, `AcademicStructureMigrationTest`, `PostgresConcurrencyTest` et parcours navigateur déjà vérifié |
| Cours, affectations, horaires, ressources, résultats et finances | `TeachingModuleTest`, `ScheduleModuleTest`, `StudentAcademicJourneyTest` et migration sur données témoins |
| Limites et mise en service | [Migration](07-migration-donnees-existantes.md), [permissions](09-permissions.md), [feuille de route](11-roadmap-evolution.md) |

Le scénario d'admission simule aussi un archivage après la lecture de la version candidate. Le rattachement automatique revérifie l'état sous verrou et laisse alors le nouveau dossier à examiner. Le dossier déjà rattaché garde sa référence historique.

Exécuter `php artisan test` sur SQLite en mémoire ; exécuter la sélection PostgreSQL et les tests de concurrence indiqués dans `.github/workflows/tests.yml` avec une base jetable nommée `umk_test`. Ne jamais utiliser une base métier. Consulter les [sorties de vérification](evidence/).

Les programmes, versions et listes d'inscriptions sont paginés. Les relations utilisées dans les listes et les maquettes sont préchargées, et les cours source d'un brouillon sont lus en une requête groupée. Les index couvrent les publications par programme et année, le chemin d'accès des inscriptions vers la maquette et les consultations des matières ; la recherche par sous-chaîne reste une recherche SQL simple. La table de correspondance des matières est réutilisée en mémoire durant une lecture du dossier ; aucun cache partagé n'exige d'invalidation. Il n'y a pas eu de mesure représentative à 5 000 utilisateurs ni d'essai sur une base de production.
