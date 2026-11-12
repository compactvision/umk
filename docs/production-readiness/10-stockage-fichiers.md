# Stockage et fichiers

Les disques privés locaux se trouvent hors du répertoire public. Le lien public cible le répertoire public prévu par Laravel. Les tests vérifient les pièces et fichiers privés, la réutilisation de fichiers temporaires, le rejet d’un type invalide, l’échec de stockage et le contrôle d’empreinte d’archives. Le vérificateur public ne sert pas le PDF.

En recette, vérifier que le serveur publie uniquement `public/`, que le stockage privé est partagé par le web et le worker, et que le serveur ne suit pas de lien public vers la racine privée. Tester la taille maximale de bout en bout et la restauration d’un fichier. S3 figure dans la configuration et sa disponibilité n’a pas été testée. [Exercice de restauration](evidence/restore-local.txt)
