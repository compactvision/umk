# Stockage, archivage et migration

Les nouveaux PDF résident sur le disque local privé dans `official-documents/{uuid}.pdf`. Les PNG de modèles sont privés et leur empreinte est vérifiée avant usage. Les résultats restent dans `official-results`. Chaque fichier est associé à une ligne d’archive et à une empreinte SHA-256. Les modèles et snapshots émis sont immuables au niveau applicatif.

## Mise en service

1. Sauvegarder et tester la restauration conjointe de la base et du stockage privé sur une copie de recette.
2. Installer les dépendances Composer et confirmer PHP GD. Configurer `APP_URL` et un disque privé persistant partagé par le web et les workers.
3. Contrôler la migration additive sur la copie puis appliquer la procédure de déploiement habituelle. Aucun déplacement ni réécriture des archives historiques n’est prévu.
4. Déclarer les permissions avec le seeder du dépôt. Les attribuer aux comptes désignés, avec leur périmètre de faculté.
5. Approuver les modèles et activer les types faculté par faculté. Tester téléchargement, QR et impression.
6. Exercer la restauration et confirmer le suivi des jobs et du volume de fichiers avant d’activer les files d’attente.

Le retour fonctionnel s’effectue par désactivation des types et des files. La migration bloque son retrait automatique afin de protéger les nouvelles archives. La purge et la durée effective relèvent d’une politique institutionnelle.
