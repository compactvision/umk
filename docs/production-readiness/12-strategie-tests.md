# Stratégie et résultats des tests

La baseline est de 359 tests SQLite. La suite finale compte 364 tests et 153 796 assertions. La suite frontend compte 59 tests. Les journaux sont conservés dans le dossier de preuves. La suite PostgreSQL a exercé 162 tests et 3 123 assertions, complétée par sept scénarios de concurrence et 49 assertions. Une passe PostgreSQL ciblée de 73 tests et 1 262 assertions a ensuite couvert les dernières optimisations du portail. Les suites utilisant les mêmes disques factices sont exécutées en série.

Le test de migration académique prépare l’état historique avec la liste des migrations antérieures, puis applique la migration cible et vérifie les identifiants, le cours, l’obligation et le paiement préservés. Les tests de phase 14 vérifient les priorités d’accès et l’absence de données périmées, la politique de référent, le contenu minimal du log et le nettoyage de la sonde de cache.

La couverture fonctionnelle est établie par scénarios. Aucun pourcentage de couverture de lignes n’est présenté. [Baseline](evidence/sqlite-baseline.txt) · [Suite finale](evidence/sqlite-final.txt) · [PostgreSQL](evidence/postgres-integration.txt) · [Concurrence](evidence/postgres-concurrency.txt)
