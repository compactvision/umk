# Observabilité et alertes

`OPERATIONS_HTTP_LOG=true` active un identifiant de réponse `X-Request-ID`. Une réponse 5xx ou une durée supérieure à `OPERATIONS_HTTP_SLOW_MS` produit un événement `http.request.threshold` avec le nom de route, le statut et la durée. La durée ne couvre pas le transfert d’un flux après retour du middleware. Les logs d’erreur Laravel existants ont leur propre politique de collecte et doivent être expurgés avant export.

| Signal | Seuil initial à confirmer | Réaction |
| --- | --- | --- |
| HTTP | Échec répété de `/up`, hausse des 5xx, p95 hors SLO | Vérifier la release, le proxy et les dépendances. |
| SQL et Redis | Connexions proches de la limite, verrous ou erreurs de lecture | Distinguer saturation, transaction longue et indisponibilité. |
| Queue | Âge du job le plus ancien, échecs ou absence de worker | Vérifier la supervision et l’idempotence avant reprise. |
| Stockage | Espace faible, erreur de lecture ou écriture | Protéger les archives et suspendre les écritures touchées. |
| Sauvegarde | Dernière sauvegarde ou restauration hors objectif | Escalader à l’exploitation et tester la copie indépendante. |

La collecte et les destinataires d’alertes de production restent à configurer. Éviter les UUID documentaires, chemins et corps dans les métriques ou les logs du proxy.
