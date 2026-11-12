# Intégrité métier

- Admissions et inscriptions conservent la référence, le matricule et le contexte. Les décisions répétées sont contrôlées par contraintes, verrous ou clés d’opération selon le service.
- Finance conserve les états du registre et les allocations. Un test PostgreSQL à deux connexions vérifie une seule confirmation financière et un seul événement d’audit.
- Results publie des snapshots par édition. Les tests de calcul couvrent les seuils, la compensation et les anomalies. Progression prépare une inscription à confirmer et vérifie le résultat source.
- Documents conserve les octets archivés, leur empreinte et leur référence. Une panne de stockage permet une nouvelle tentative depuis l’état approuvé. Le registre public expose le statut minimal.
- La fin de cursus et l’émission du diplôme restent deux actes distincts. Les corrections d’un dossier passent par le propriétaire de la donnée.

Une vérification des anomalies historiques doit utiliser une copie autorisée de la base métier. Aucun rapprochement de données réelles ni correction d’historique n’a été lancé.
