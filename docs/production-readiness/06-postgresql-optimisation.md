# PostgreSQL et modèle relationnel

Les suites ciblées ont utilisé PostgreSQL 16 dans un conteneur jetable, avec une base `umk_test` publiée uniquement sur loopback. Les tests à deux connexions utilisent des barrières explicites. Le test de migration historique reconstruit les migrations antérieures au jalon puis applique le jalon. Le retrait isolé d’une ancienne table échouait sur PostgreSQL à cause des clés étrangères ajoutées ultérieurement. [Intégration](evidence/postgres-integration.txt) · [Concurrence](evidence/postgres-concurrency.txt)

Le contrôle de performance local a mesuré le nombre de requêtes et les latences du noyau HTTP sur SQLite. Aucun index spéculatif n’a été ajouté. Sur la recette cible, mesurer `EXPLAIN (ANALYZE, BUFFERS)` pour les lectures représentatives et les statistiques de verrous et de connexions. Tester les écritures sur une base jetable. Suivre la lecture des répertoires, les offres, les vues financières, les résultats et les archives.

Le fichier local sélectionne MySQL. Le moteur de production reste à confirmer. Un changement de moteur exige un chantier validé avec contrôles des contraintes, des collations, des conversions et du retour arrière.
