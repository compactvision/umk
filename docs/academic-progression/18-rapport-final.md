# Rapport de livraison de la phase 13

| Domaine | Résultat livré |
| --- | --- |
| Préservation | Identité et matricule permanents, admissions, inscriptions historiques, maquettes, notes, résultats, décisions de jury, transactions et archives documentaires. |
| Progression | Passages et redoublements depuis les décisions officielles, échéances conditionnelles et plans de reprise rattachables aux offres compatibles. |
| Cycle de vie | Dossiers motivés de réorientation, transfert externe, interruption, reprise, changement de cycle et fin de cursus. Révision, refus et approbation par un agent distinct. |
| Modèles | Enrichissement de `AcademicProgression`, ajout de `AcademicLifecycleCase` et `AcademicRetakeAssignment`. |
| Fin de cursus | Contrôle des UE et crédits certifiés, règle publiée, exigences complémentaires et approbation académique distincte de l’émission. |
| Interfaces | Back-office paginé, historique et liens depuis le dossier 360°, décisions et crédits autorisés dans l’espace étudiant. |
| Responsabilités | Confirmation dans Enrollment, équivalences et crédits dans Results, barèmes dans Finance, émission dans Documents. |

## Vérification

| Contrôle | Résultat |
| --- | --- |
| Baseline PHP | 355 tests réussis, 153 670 assertions. [Journal](evidence/baseline.txt) |
| Suite PHP finale | 359 tests réussis, 153 777 assertions. [Journal complet](evidence/final.txt) |
| Scénarios ciblés | Contrôle de diplomation, séparation des autorités, progression conditionnelle et reprise inter-niveaux, interruption et reprise, révision concurrente simulée par version périmée, et crédits sur deux années. [Journal](evidence/lifecycle.txt) |
| Interface | Compilation Vite, TypeScript, ESLint et 59 tests frontend réussis. |
| Migration et capacité | Migration exercée sur SQLite de test. Les scénarios k6 sont préparés pour la recette. |

## Points à valider pour la mise en service

- L’établissement renseigne les règles de passage, reprise et fin de cursus dans les règlements Results. Les seuils, les maxima et les exigences restent propres aux programmes.
- Les reprises alimentent Teaching via les offres et les inscriptions pédagogiques. La reconnaissance officielle des acquis reste dans Results. Les transferts externes conservent une référence de dossier et passent par Admissions ou Enrollment pour leurs effets administratifs.
- La préparation des dossiers se fait individuellement dans le back-office, avec filtres et pagination. Le scénario de recette prépare une campagne de dossiers jetables. Le traitement en masse et la concurrence MySQL n’ont pas été mesurés.
- Les diplômes historiques sont préservés. Une nouvelle émission exige une décision de fin de cursus valide pour l’édition publiée et le mandat Documents.
- La suite du projet peut s’appuyer sur les cas de parcours approuvés, les versions de résultats et les liens Enrollment, Teaching et Documents.

Voir la [matrice des permissions](16-permissions-audit.md), le [contrat entre domaines](15-integration-enrollment-results.md) et le [plan de recette](17-performance-tests.md).
