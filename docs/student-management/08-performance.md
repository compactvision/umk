# Performance

Le répertoire utilise la pagination SQL par 15 et des relations préchargées. La vue Répertoire affiche le contexte annuel le plus récent par profil ; les vues annuelles et historiques conservent tous les contextes. La recherche couvre nom, prénom, postnom, email et matricules annuel/permanent. Les filtres incluent année, faculté, programme, niveau, département et statut.

Le dossier charge ses sections à la demande : aucune lecture des présences ou des paiements pour le résumé d’un agent sans permission financière (test de requêtes exécuté). Présences, ressources, paiements et chronologie : 25 par page. Inscriptions : 20 par page. Aucun cache partagé de données personnelles.

Les index existants couvrent matricules, clés étrangères, contexte unique et entités auditées. La migration additive de phase 05 ajoute `(academic_year_id, enrollment_status, id)`, l’historique des demandes et le registre des décisions. Les recherches de sous-chaînes `%terme%` ne bénéficient pas toutes d’un index B-tree ; un index trigramme PostgreSQL est une évolution possible après mesure, pas une performance revendiquée.

Scénarios : `scripts/load/enrollment-management.js`, lecture du répertoire, ouverture du résumé, lecture paginée des décisions. Vérifier latence, erreurs, volume SQL et saturation sur une infrastructure de recette, puis augmenter progressivement la concurrence. Les 5 000 connexions simultanées ne sont pas validées.

Le scénario k6 utilise `TARGET_ENV=staging`, `BASE_URL`, `ACCOUNTS_FILE` et `TARGET_VUS`. Modes `read` (défaut), `double-submit` (deux requêtes simultanées de suspension avec la même clé) et `confirmation` (confirmations concurrentes sur contextes de recette financièrement éligibles). Les modes de mutation exigent cookie, jeton CSRF et clé UUID par compte jetable. Ne pas publier ces données de session dans le dépôt. Ils sont préparés, pas exécutés pendant cette intervention.
