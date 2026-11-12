# Tests et validation

Baseline SQLite avant la phase : 244 tests, 150 684 assertions. Exécuter la suite principale avec `php artisan test`. Les scénarios d’admission sont notamment dans `AdmissionConsolidationTest`, `EnrollmentReviewWorkflowTest`, `EnrollmentJourneyTest`, `AdminEnrollmentManagementTest`, `StudentEnrollmentPortalTest` et `StudentAcademicJourneyTest`. La CI PostgreSQL reprend les scénarios et `PostgresConcurrencyTest` avec deux processus sur la base jetable `umk_test`.

| Vérification locale | Résultat |
|---|---|
| SQLite en mémoire | 247 tests réussis |
| PostgreSQL 16 jetable | 95 tests d’intégration et 7 tests de concurrence réussis |
| Frontend | 51 tests réussis, TypeScript, ESLint et build Vite validés |
| Navigateur sur une copie SQLite fictive | Création d’une campagne, puis accès à la file « Nouvelles candidatures » depuis la barre admin |
| Scénario k6 d’admission | Syntaxe JavaScript vérifiée. Exécution en charge à planifier sur un environnement de test représentatif. |

Les [sorties de vérification](evidence/) conservent les détails. Le premier rejeu PostgreSQL a révélé qu’une assertion utilisait un opérateur JSON sur le champ texte des notifications. Le test lit désormais la valeur convertie par Laravel, en conservant les assertions sur le verdict et l’absence de doublon.

| Erreur | Comportement de reprise |
|---|---|
| Année ou campagne fermée | Le brouillon est conservé. L’interface affiche le motif et permet de revoir le choix. |
| Brouillon expiré | Commencer un nouveau dossier. L’ancien est conservé. |
| Fichier absent ou temporaire expiré | Téléverser à nouveau la pièce. |
| Double clic de soumission | Même dossier et même matricule, un seul reçu. |
| Décision opposée déjà prise | Le second agent recharge le dossier et consulte la décision. |
| Échec de remise email | Le dossier reste accessible. L’événement email_failed est consultable par l’administration. |
| Accès oublié | Utiliser la récupération du compte Identity et, si nécessaire, la vérification d’adresse existante. |

La liste pagine côté serveur et charge ses relations principales en amont. Les filtres JSON de campagne et de soumission exploitent le schéma actuel. Un pic réel peut justifier des index et des mesures de plans SQL adaptés au moteur retenu. Le [scénario k6](../../scripts/load/admissions.js) distingue les consultations publiques, les soumissions et les dépôts multipart. Le mode `catalogue` utilise uniquement le site public. Les modes `upload` et `submit` prennent `ACCOUNTS_FILE`, un tableau JSON de comptes fictifs contenant email, password et, pour la soumission, draft_uuid. Un dossier complet distinct est nécessaire par compte. Le mode `upload` prend aussi `PDF_FILE`, un fichier fictif. Exemple pour le catalogue : `TARGET_ENV=staging BASE_URL=http://127.0.0.1:8768 FLOW=catalogue COUNT=1 k6 run scripts/load/admissions.js`. Les tests locaux ne mesurent pas une capacité de production à 5 000 utilisateurs.
