# CI/CD

Les workflows de validation couvrent Composer, npm, TypeScript, ESLint, tests frontend, build Vite, PHP et audits. Le job PostgreSQL construit les assets et inclut les parcours Results, Documents et Progression ainsi que les contrôles de phase 14. La syntaxe YAML a été vérifiée localement. L’exécution des jobs sur GitHub et les règles de protection des branches et de l’environnement restent à vérifier.

Le workflow Nitrohost est manuel sur `main`. Il exige une référence de changement et les confirmations de restauration et de compatibilité de rollback. Le job de déploiement utilise l’environnement `production`. Configurer les réviseurs requis sur GitHub. Le point d’entrée cPanel présent dans le dépôt échoue volontairement avant toute opération de déploiement. Vérifier les webhooks et tâches externes déjà configurés.
