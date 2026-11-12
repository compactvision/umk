# Stockage, intégrité et migration éventuelle

Les nouveaux fichiers sont enregistrés dans `learning-content/` sur le disque `local` privé. Les disques historiques locaux sont acceptés si le chemin résolu reste dans la racine configurée. La diffusion passe par une route authentifiée et n’expose ni disque ni chemin interne. Le téléchargement est une pièce jointe avec `private, no-store` et `nosniff`. La prévisualisation locale vérifie de nouveau le MIME et sert les plages d’octets pour les médias compatibles.

Un échec lors de l’enregistrement retire le nouvel objet si celui-ci a été écrit. `php artisan academic:learning-file-audit` inventorie en lecture seule les références indisponibles et les candidats orphelins dans le préfixe des nouveaux fichiers. Le contrôle inclut les versions. Exécuter l’inventaire hors écritures ou confirmer chaque candidat lors d’un second passage avant toute suppression approuvée. Une écriture peut être en cours entre le stockage et la validation de la transaction.

Le téléchargement S3 est optionnel via `LEARNING_CONTENT_DIRECT_S3_DOWNLOADS`. Il nécessite l’adaptateur AWS et un compartiment privé. Après autorisation Laravel, la redirection utilise un lien signé valable deux minutes. Un lien déjà signé reste utilisable jusqu’à son expiration. Le chemin local reste le mode utilisé par les nouveaux dépôts. S3 et l’expiration n’ont pas été validés sur une infrastructure réelle.

Plan de migration à valider séparément avant toute copie

1. Inventorier les fichiers actuels et les versions, y compris les objets partagés.
2. Préparer une correspondance entre disques et clés, conserver les références originales et sauvegarder la base.
3. Copier vers le compartiment privé et comparer les tailles et empreintes calculées des deux côtés.
4. Préparer un mécanisme audité de conversion des références historiques immuables, ou une table de résolution conservant leurs valeurs. Tester en recette l’autorisation, les signatures, les objets manquants et les versions réutilisées.
5. Basculer un lot approuvé et contrôler les accès. En retour arrière, rétablir la résolution locale à partir de l’inventaire et conserver les deux ensembles de fichiers pendant la période de vérification.
