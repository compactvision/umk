# Base de données et intégrité

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

## Validation exécutée

Suite PHPUnit : migrations exécutées en SQLite mémoire avec RefreshDatabase. Contrôle supplémentaire : toutes migrations sur `/tmp/umk-audit-migrations.sqlite` jetable, puis migrate:status (toutes Ran). Aucune migration historique modifiée, aucune base existante réinitialisée. Base locale configurée MySQL ; aucun examen de données de production, EXPLAIN représentatif ou exécution PostgreSQL effectué. La CI distante n’a pas été exécutée, mais ses suites PostgreSQL ont été exécutées localement sur le conteneur isolé.

## Contraintes examinées

`2026_11_01_180000_create_student_academic_portal.php` : profil user unique, matricule profil unique, application d’inscription unique, contexte profil/niveau/année unique ; obligations uniques inscription/kind/tranche ; paiements uuid et référence uniques ; dépôt unique inscription/ressource. Relations cœur académiques/financières en restrictOnDelete. Montants en centimes et devise sur inscription/paiement.

Les cascades des academic_offerings vers sessions/resources/exceptions existent ; academic_submissions restreint la suppression d’une ressource déposée. Les migrations historiques Faculty/Level/classes/conditions utilisent aussi des cascades. Les contrôleurs de suppression et tests AdminAppsTest empêchent certaines suppressions non vides ; ce n’est pas une protection universelle contre SQL direct. Prévoir un inventaire métier de conservation avant toute migration additive de contraintes. Ne pas modifier les migrations historiques.

`users` contient first_name/last_name et non name ; correction de la factory sans changement de schéma. Champ deleted_at présent mais User n’utilise pas SoftDeletes : ne pas supposer une suppression logique effective. Ne pas réactiver la suppression de compte du starter kit sans stratégie de conservation académique/financière.

## Transactions et concurrence

| Opération | Protection observée | Limite |
|---|---|---|
| Admission | verrou Enrollment puis User, transaction, contexte unique, audit | Intégration PostgreSQL réussie ; voir tests concurrents ciblés ci-dessous |
| Matricule | compteur faculty_matricule_sequences, insertOrIgnore puis lockForUpdate, recherche existants | Amorçage lit des listes ; vérifier plan/temps sur volumétrie |
| Soumission candidature | transaction ; ajout du verrou de la ligne Enrollment dans cette phase | Deux requêtes ne doivent plus attribuer indépendamment le même dossier ; la sérialisation du même dossier est couverte par les transactions ; les deux tests multiprocessus ciblent matricule et confirmation de paiement |
| Paiement / changement statut | verrou inscription puis paiement ; références uniques ; transitions contrôlées | Les erreurs d’unicité concurrentes de saisie peuvent nécessiter mapping ValidationException |
| Prestataire | ProviderPaymentReconciliation vérifie référence/montant/devise, refuse transition invalide, replay confirmed sans nouvel effet | Aucun webhook public ni verifier opérationnel établi ; faux constat d’absence d’idempotence évité |
| Ajustement / barème | transaction, verrou inscription, historique et motif | Montants unsigned ne garantissent pas une contrainte non négative PostgreSQL |
| Remplacement pièce examinée | transaction et verrous dossier/document, nettoyage prévu | Fichier et SQL ne forment pas une transaction distribuée |
| Dépôt travail | verrou inscription, unique dépôt, version et audit ancien contenu | Test de race et reprise stockage requis |
| SaveProgress | contrôle propriétaire brouillon et désormais temp ; stockage avant suppression ancien fichier vérifié | Transaction, verrou utilisateur puis dossier, compensation des copies non commises et suppression des anciens fichiers après commit ; tests de panne et de commit réussis SQLite/PostgreSQL |

Pas de promesse de rollback total fichier/DB : implémenter un stockage préparé, commit DB et nettoyage après commit, avec test de panne à chaque étape, avant généralisation.

## Requêtes et index

AcademicAccessService::permissions répète par feature règle + adjustments + balance ; balance lit obligations/paiements et activeAdjustments. StudentOverviewService rappelle finance par catégorie. AcademicAdministrationController charge certaines collections entières (cours, niveaux, paiements sélectionnés) ; StudentPortalController charge demandes/paiements/dépôts sans pagination. Les pages administratives d’inscriptions ont déjà des filtres/pagination : ne pas conclure à une absence globale.

Index existants utiles : academic_offerings(level_id, academic_year_id, is_published), student_payments(academic_enrollment_id,status), resources(offering,kind,publication), access_rules(feature,is_active), starts_at sur sessions. Aucun nouvel index spéculatif ajouté. Capturer nombre/temps SQL par parcours, EXPLAIN ANALYZE en staging et cardinalités avant index. PostgreSQL n’indexe pas automatiquement toutes les FK comme certains usages MySQL : examiner jointures et coûts d’écriture avant ajout.

## Portabilité

SQLite ne valide pas les verrous ligne, contention, enums/checks, unsigned, collations, timezone ou contraintes de production. Examens ciblés CASE WHEN/whereDate présents, sans injection démontrée. Prévoir PostgreSQL : migration complète, transitions financières, activation, rapprochement prestataire et races avec deux connexions ; comparaison MySQL si c’est le moteur retenu. Toute correction schéma devra être nouvelle migration compatible, précontrôle des doublons/orphelins, sauvegarde, estimation verrouillage et retour arrière sans perte d’historique.

## Résultats PostgreSQL et concurrence

PostgreSQL 16 démarré dans un conteneur jetable localhost:25432, base umk_test exclusivement. 78 tests d’intégration métier réussis, puis 8 tests de révocation/reprise de fichiers réussis. Le premier passage a révélé des fixtures créant des codes trop longs pour varchar(10) ; les fixtures ont été corrigées sans élargir le schéma. Une exécution parallèle de suites SQLite/PostgreSQL partageant Storage::fake a aussi été identifiée : les suites avec fichiers ont été relancées séquentiellement.

`tests/Integration/PostgresConcurrencyTest.php` lance deux processus synchronisés par barrière, avec connexions distinctes. Les deux allocations produisent TEST0001 et TEST0002 ; deux confirmations simultanées conservent un seul paiement, 10000 centimes confirmés et un seul événement payment_confirmed. Résultat : 2 tests / 12 assertions.

Un défaut historique du down de la migration enrollments a été observé lors d’un essai de teardown SQLite : suppression d’une colonne indexée sans retrait préalable de l’index. Cette migration n’a pas été modifiée ni exécutée à rebours sur des données existantes. Le rollback opérationnel prévu est applicatif avec schéma compatible, pas un rollback automatique des migrations ; corriger et tester les down historiques avant tout projet de retour arrière de schéma. Les tests de commit utilisent une base jetable créée selon la convention déjà utilisée par StudentAcademicJourneyTest.
