# Redis, cache et queues

Le fichier d’exemple configure les sessions, le cache et la queue en base. Redis est configurable. Le test Redis 8.6 local sur socket privé a confirmé PONG, une écriture avec TTL, sa lecture et l’isolation d’une autre base logique. Un worker Laravel a consommé un job synthétique sur la file SQLite de test, avec marqueur privé écrit, file vide et aucun échec. [Worker](evidence/queue-local.txt)

Le client PHP Redis et l’usage des files et sessions Redis dans l’environnement cible restent à vérifier.

`app:preflight --runtime` contrôle une clé temporaire et la profondeur de la file par défaut pour les pilotes base ou Redis. Il ne prouve pas l’exécution d’un worker. Configurer la supervision du processus, la durée maximale d’un job et un `retry_after` supérieur au timeout du worker. Vérifier la consommation d’un job test, la reprise d’un job échoué et le redémarrage après activation.

L’émission documentaire réutilise la transaction et les contrôles du workflow en cas de nouvelle tentative. Les notifications sensibles doivent être déclenchées après commit. Préserver les files et leur stockage partagé pendant un rollback. Horizon et la haute disponibilité Redis sont des décisions de recette.
