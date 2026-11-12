# Performance et préparation à la charge

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

**Capacité de 5 000 utilisateurs non validée.** Aucun benchmark représentatif de production ni campagne de charge massive exécutés. k6 a ensuite été utilisé dans Docker pour un smoke test local à un utilisateur, et PostgreSQL 16 testé via Docker. Le build réussi ne mesure pas la capacité serveur.

## Points sensibles observés

Authentification : cache partagé nécessaire et limiter get/put non atomique. Dashboard : décisions d’accès et agrégations financières répétées. Cours : eager loading course/professor déjà présent. Emplois du temps : bornes journalières et limites dans StudentOverviewService ; verrous larges d’année pour écritures Teaching. Téléchargements : flux via PHP, besoin de débit disque/réseau et workers à mesurer. Dépôts : sérialisation par inscription, stockage et transaction à mesurer. Résultats actuels : ressources personnelles publiées, pas moteur de délibération.

## Optimisations proposées, sans cache privé partagé

1. Instrumenter nombre de requêtes SQL, temps cumulé et latence par route ; budgets par parcours, puis factoriser règles/adjustments/balances pendant une seule requête.
2. Paginer historiques longs par contrats compatibles avec UI ; éviter de charger toutes les données pour chaque section Portal.
3. Cache institutionnel court avec clés versionnées et invalidation explicite lors mutation : structure, catalogues publics, années ouvertes, paramètres Site. Ne pas cacher décisions personnelles ni solde sous clé commune. Un cache request-scoped doit être invalidé après mutation de la même requête et ne doit pas survivre à un worker long.
4. Emails différables en jobs après commit une fois workers établis : timeout proposé 60 s, retry_after > timeout, tries 3, backoff 10/60/300 s, suivi failed_jobs et idempotence par événement/notification. Pas de bascule sync→async sans worker supervisé. Email de soumission désormais après commit, toujours synchrone.
5. Documents lourds : évaluer S3 privé et URLs signées après autorisation ; mesurer coût et débit avant migration avec manifeste SHA256, double lecture et rollback.

## Scénarios reproductibles

`scripts/load/student-journey.js` : login Laravel avec CSRF et cookies, compte distinct par VU, vues overview/cours/horaires/frais/transactions, résultats si permis, supports si configurés ; dépôts texte opt-in. Ramp-up 2 minutes, maintien 10 minutes par défaut, descente 2 minutes, réflexion 3–10 s. Chaque login survient au démarrage du VU ; préparer un scénario de reconnexion/rafale séparé pour les rentrées. Le script ne charge pas les assets navigateur et ne prouve ni rendu React ni Core Web Vitals.

Préparer une copie de staging autorisée, comptes vérifiés distincts et inscriptions actives, règles/obligations/offres publiées cohérentes. Le fichier d’exemple ne crée aucun compte. Copier accounts.example.json vers un emplacement privé avec au moins autant de comptes que le palier. Ne jamais committer les mots de passe. TARGET_ENV=staging est un garde déclaratif, pas une détection du serveur : vérifier BASE_URL avant lancement. Le fichier accounts.local.json et les résultats sont ignorés par Git.

Exemple, sur infrastructure de test autorisée uniquement :

```sh
TARGET_ENV=staging BASE_URL=https://staging.example.test ACCOUNTS_FILE=/chemin/prive/accounts.json TARGET_VUS=100 k6 run --summary-export=/tmp/umk-load-100.json scripts/load/student-journey.js
```

Répéter séparément pour 100, 500, 1000, 2500 puis 5000 ; arrêter l’escalade dès dépassement des seuils ou saturation. ALLOW_WRITES=true active les dépôts texte uniquement sur assignments dédiés aux tests. Prévoir scénario de fichiers réels de tailles contrôlées, consultation massive simultanée des résultats et login burst distincts avant certification. Aucun appel de production autorisé par cette documentation.

## Seuils proposés à approuver par mesure

- Erreurs HTTP et fonctionnelles < 1 % ; aucune fuite interutilisateur, aucun paiement/dépôt perdu ou dupliqué.
- P95 < 1,5 s et P99 < 3 s pour requêtes applicatives ; suivre P50, débit req/s et par route, pas seulement moyenne globale.
- CPU soutenue < 70 %, mémoire < 80 % sans croissance continue, connexions DB < 80 % de capacité, pas d’attente FPM durable.
- SQL lent > 200 ms à investiguer ; temps SQL par page et locks à collecter. Queue : P95 attente < 30 s sur emails, aucun échec définitif inexpliqué.
- Mesurer téléchargement séparément par taille : débit et intégrité SHA256 ; seuil de durée ne doit pas ignorer la taille.

k6 expose débit/latences/erreurs ; CPU/RAM/FPM/DB/queue nécessitent mesures côté serveur corrélées temporellement. Ces seuils sont des objectifs, pas des résultats acquis.

## Vérification du scénario k6

Mode SMOKE=true / TARGET_VUS=1 ajouté pour valider le scénario avant les paliers de charge. Base SQLite jetable /tmp, compte exclusivement de test, serveur PHP lié à localhost, APP_ENV=local pour conserver CSRF actif. Le smoke inclut un refus HTTP 419 d’écriture sans CSRF, puis login avec cookie/token, page étudiante initiale, version Inertia et parcours de lecture.

Le test a révélé deux défauts de préparation du script : version Inertia à transmettre et cookies réinitialisés entre itérations par défaut k6. Le script lit maintenant la version de page et utilise noCookiesReset=true. Les échecs intermédiaires n’ont pas été considérés comme une validation ; la sortie finale réussie figure dans evidence/k6-smoke.txt. Les données et processus de test sont indépendants de la base MySQL configurée. Ce test bref à 1 VU valide le protocole du scénario, pas les capacités, la couverture de téléchargement/dépôt ou la robustesse à 5 000 utilisateurs.

Smoke final : 45 requêtes, 0 erreur HTTP inattendue et 0 erreur fonctionnelle ; l’écriture sans CSRF sur une session authentifiée est bien refusée. Le refus attendu est distingué des erreurs de parcours dans les métriques.
