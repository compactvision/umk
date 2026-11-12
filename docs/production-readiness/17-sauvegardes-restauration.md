# Sauvegardes et restauration

Exercice local réussi sur PostgreSQL 16. Une base jetable avec toutes les migrations a reçu un dossier synthétique et une pièce privée. Le dump a été restauré dans une deuxième base vide, le fichier dans un répertoire distinct. Le préflight de la base restaurée, le matricule et la concordance SHA-256 entre le fichier et la référence restaurée ont été vérifiés. [Preuve](evidence/restore-local.txt)

1. Définir RPO et RTO avec l’établissement. Maintenir une copie chiffrée et séparée du serveur, avec permissions et rétention validées.
2. Geler les écritures pertinentes ou coordonner un point cohérent entre snapshot SQL et fichiers. Conserver le manifeste d’empreintes et la référence de la release.
3. Restaurer en recette isolée. Pour PostgreSQL, utiliser le dump et `pg_restore --exit-on-error --no-owner` vers une base vide. Pour MySQL, appliquer la procédure correspondant au moteur et à la version réels.
4. Restaurer les fichiers privés dans une racine isolée. Vérifier les migrations, comptes de test, volumes, références, chemins et empreintes. Confirmer que les fichiers restent privés.
5. Mesurer les durées et comparer au RPO et au RTO. En production, faire approuver le point de restauration et l’impact sur les écritures avant de remettre le trafic.

L’exercice local ne valide ni le système de sauvegarde de production ni son délai de restauration.
