# Déploiement et rollback

1. Sélectionner le commit approuvé sur `main` après succès de la CI et recette. Vérifier que la release précédente accepte le schéma cible.
2. Sauvegarder la base et le stockage privé dans la même fenêtre de cohérence. Vérifier la restauration. Provisionner les secrets dans le répertoire partagé.
3. Lancer le workflow manuel avec la référence de changement. Le job de production attend la validation de l’environnement GitHub lorsque ses protections sont configurées.
4. Vérifier le build, la clé existante, HTTPS, les cookies et les extensions. Construire les caches de la release. Exécuter les migrations prévues et contrôler la base, le cache et la file.
5. Basculer le lien `current` par remplacement atomique sur Linux. Redémarrer les workers. Contrôler `/up`, puis connexion, liste étudiante, document et consommation d’un job synthétique.
6. Si la bascule ou les contrôles échouent, conserver les preuves. Le script repointe vers le lien précédent si disponible après un échec de redémarrage ou du contrôle HTTP. Vérifier les logs et le numéro de version réellement servi.

La bascule et le retour du lien ont été vérifiés sur Linux avec deux releases fictives. [Exercice local](evidence/rollback-local.txt)

Le rollback applicatif suppose un schéma compatible. Pour un schéma incompatible ou des données corrompues, isoler les écritures, évaluer le point de restauration et faire valider la procédure avec l’exploitation. Aucun rollback SQL automatique. Le workflow ne supprime plus automatiquement les releases précédentes.
