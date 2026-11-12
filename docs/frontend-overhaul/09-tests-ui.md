# Baseline et contrôles par lot

| Contrôle | Baseline | Lot 1 |
|---|---|---|
| PHPUnit, SQLite en mémoire | 366 tests, 153 865 assertions | Suite initiale de référence |
| `npm run test:frontend` | 59 réussis | 59 réussis |
| `npm run types` | Réussi | Réussi |
| `npm run lint:check` | Réussi | Réussi |
| Vite, sortie temporaire | Réussi | Réussi |
| Mesures Chrome du layout isolé | — | 24 réussies sur 24 |
| `git diff --check` sur les fichiers du layout | — | Réussi |

Vite signale deux images résolues au runtime dans les deux compilations. Les fichiers sont présents dans `public/assets`.

## Contrôles ciblés après les lots 1 et 2

- PHPUnit ciblé sur les cartes, le portail d’inscription et le transport Inertia des années académiques. 14 tests, 439 assertions.
- Après consolidation de la pagination, 59 tests frontend réussis, typage et lint réussis.

## Contrôles ciblés du lot 3

- PHPUnit ciblé sur enseignements, supports, évaluations, admissions et portail d’inscription. 37 tests, 1 101 assertions.
- Suite frontend. 61 tests réussis, dont deux tests de navigation ajoutés.
- Typage, lint, compilation Vite temporaire, syntaxe des routes et contrôle des espaces du diff réussis.
- Les 79 URLs de la sidebar administrative correspondent à un chemin GET enregistré. Les paramètres et périmètres restent à vérifier.

## Clôture du lot navigation

- PHPUnit ciblé, relancé seul pour isoler le stockage de test. 125 tests, 2 934 assertions.
- 54 URLs administratives distinctes vérifiées pour cinq profils d’administration. Les six destinations avec fragments sont également contrôlées par les tests frontend.
- Suite frontend. 70 tests réussis. Typage, lint et compilation Vite temporaire réussis.
- Chrome, pages Inertia issues de sessions de test. Neuf scénarios réussis à 375, 768 et 1 440 px pour les profils administration, candidature et enseignement. Ouverture de la sidebar sur mobile, ouverture du sous-menu, présence d’une destination attendue, fermeture par Échap et restitution du focus.

## Lot Actualités

- `NewsVideoTest`, `SeoPublicTest` et `LandingContentSeederTest`. 22 tests, 284 assertions. Création et édition par accès direct, filtres, suppression autorisée et interdite, galerie et rejet d’une édition obsolète.
- Suite frontend, typage, lint et compilation Vite temporaire réussis après les changements.

## Lot Niveaux et catalogue

- `AdminAppsTest`, `CourseCatalogTest`, `LevelPricingTest`, `DepartmentOrientationTest` et `AdmissionConsolidationTest`. 32 tests, 770 assertions.
- Accès direct et onglets, refus hors périmètre, statut du catalogue, suppression refusée en présence de dépendances et conservation de l’illustration après un échec de stockage.
- Suite frontend. 74 tests réussis, dont les cas de brouillon, d’illustration et d’actions sur les cours. Typage, lint et compilation Vite temporaire réussis.

## Lot Dépôts pédagogiques

- `AssessmentWorkflowTest`, `StudentAcademicJourneyTest` et `StudentEnrollmentPortalTest`. 64 tests, 1 626 assertions.
- Dossier et liste filtrée, version courante et antérieure, version textuelle, fichier, version absente, refus étudiant et refus administratif hors périmètre.
- Suite frontend, typage, lint et compilation Vite temporaire réussis.

## Clôture des formulaires Actualités

- Vérification de l’effacement explicite des champs facultatifs et de la conservation des champs omis. Les contrôles d’étiquettes ont été retirés, faute de fonctionnalité Laravel associée.
- `NewsVideoTest`, `SeoPublicTest` et `LandingContentSeederTest`. 22 tests, 287 assertions.

## Régression finale

- PHPUnit, suite complète et stockage de test isolé. 376 tests et 154 270 assertions.
- Suite frontend. 74 tests réussis. Typage, lint et compilation Vite temporaire réussis.
- Inventaire final. 332 routes, 324 actions applicatives résolues et 66 réponses Inertia à nom littéral avec composant présent. Les 13 ressources signalées comme résolues à l’exécution lors du build sont présentes dans `public/assets`.
- `git diff --check` réussi.

## Reprise des parcours Chrome

- Actualités, Niveaux et Dépôts pédagogiques vérifiés successivement dans Chrome sur le serveur Laravel local avec les assets compilés. Le document 10 détaille les scénarios et les vérifications.
- Régression du chargement d’une page Inertia sans entrée dédiée dans le manifeste Vite, ajoutée à `AcademicYearTransportTest`.
- Après correction, 377 tests PHP, 154 281 assertions et 74 tests frontend réussis. Typage, lint et `git diff --check` réussis.

## Admissions, Finances, Inscriptions, Enseignements et Planning

- Admissions. 32 tests PHP, 860 assertions. Une régression couvre les redirections après prévisualisation d’une pièce.
- Finances et contrôles de session. 36 tests PHP, 618 assertions. L’export conserve la page de retour. Le test frontend vérifie que le lien CSV est natif et conserve les filtres.
- Inscriptions, enseignements et planning. 41 tests PHP ciblés, 592 assertions. Les scénarios Chrome et leurs résultats sont détaillés dans le document 10.
- Régression complète après les cinq lots. 378 tests PHP et 154 298 assertions avec `php -d memory_limit=256M vendor/bin/phpunit --do-not-cache-result`. La première exécution avait atteint la limite locale de 128 Mio lors d’une inspection MIME.
- Suite frontend. 75 tests réussis. Typage, lint, compilation Vite temporaire et `git diff --check` réussis.
