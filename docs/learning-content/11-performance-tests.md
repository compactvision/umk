# Performance et vérifications

La bibliothèque pagine les offres, ressources, séances, travaux et versions. Le cours limite les ressources à 25 par page, charge les sections et vérifie en lot les séances de la page. Les contrôles de fichiers s’exécutent à la demande. Les autorisations sont recalculées lors du téléchargement. Le compteur agrégé compte les demandes de téléchargement étudiant autorisées hors prévisualisation, HEAD et Range. Il ne mesure ni la réception intégrale des octets ni la lecture.

Le disque local sert les fichiers via une réponse binaire. Pour des transferts volumineux, valider un stockage objet privé ou une délégation interne au serveur web après autorisation. Mesurer les performances et les invalidations avant d’ajouter un cache d’accès, un CDN privé ou un traitement média asynchrone. La résolution des destinataires d’une notification parcourt l’audience par lots dans la requête de publication. L’envoi en file optionnel concerne la livraison.

Le scénario k6 `scripts/load/learning-content.js` vise une recette avec comptes et fichiers jetables. Exemple de lecture

```sh
k6 run -e TARGET_ENV=staging -e BASE_URL=https://recette.example \
  -e ACCOUNTS_FILE=/chemin/prive/learning-sessions.json \
  -e MODE=read -e TARGET_VUS=20 scripts/load/learning-content.js
```

Le JSON contient un tableau avec `role`, `cookie` et les identifiants applicables parmi `academic_id`, `course_id`, `offering_id` et `resource_id`. Pour `upload` et `publish`, fournir aussi `csrf`, un `operation_key` UUID ou la `revision` du brouillon et un scénario dédié par VU. Activer explicitement `ALLOW_WRITES=disposable` et fournir `PDF_FILE` pour l’envoi. Le mode `download` accepte `DIRECT_S3=true` sur la recette S3. Le mode `renew` utilise la recette S3 pour vérifier la signature avant et après 125 secondes, puis obtenir un nouveau lien. Le mode `media` utilise un fichier privé assez grand pour mesurer des lectures partielles.

Comparer par paliers la latence, les refus inattendus, les erreurs, les octets servis, les connexions SQL et les travailleurs occupés. Vérifier la validité et l’expiration des liens signés si S3 est activé. Le scénario a été contrôlé syntaxiquement. Aucun essai de charge en recette ni mesure de capacité à 5 000 connexions n’a été réalisé.
