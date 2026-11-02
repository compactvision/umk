# Clé d’application, erreurs réseau et année de démonstration

## Diagnostic et correction sur le serveur

La trace fournie du 2 novembre 2026 à 13:03 contient `MissingAppKeyException: No application encryption key has been specified`. Laravel ne disposait pas de sa clé de chiffrement pour traiter les cookies/sessions, y compris lors de la terminaison de la requête. Le code des années académiques n’est pas la cause de cette exception.

La page publique de connexion a ensuite répondu HTTP/2 200 lors du contrôle distant, et le renvoi anonyme de la page des années vers la connexion a répondu 302. Cela ne valide pas les requêtes authentifiées ni tous les processus PHP. Aucun identifiant du serveur n’a été utilisé et aucune configuration ou donnée distante n’a été modifiée. Une autre cause de rupture HTTP/2 côté hébergeur reste possible si le problème persiste après remise en état de la configuration.

Après installation de cette version, dans le répertoire réellement servi, avec le même PHP que l’application :

```sh
cd /home/loje6951/repositories/umk
ls -l .env
php artisan config:clear
```

Vérifier que ce `.env` contient **la clé existante de cette installation** et les paramètres de déploiement : `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://usk.axumindustries.com`. Restaurer la clé depuis la configuration ou une sauvegarde de cette même installation si elle a été perdue. Ne pas la remplacer par la clé d’un environnement local, ni la communiquer dans les journaux ou le dépôt.

Uniquement pour une toute première installation qui n’a jamais possédé de clé ni de données chiffrées :

```sh
php artisan key:generate --force
```

Après restauration/initialisation de la bonne configuration :

```sh
php artisan optimize:clear
php artisan migrate --force
php artisan app:preflight --production --database --assets
php artisan config:cache
```

Si les processus PHP utilisent encore une ancienne configuration, les redémarrer depuis l’outil de l’hébergeur et purger son cache après correction. Réessayer ensuite la consultation des années et une ouverture. En cas de nouvel échec, comparer l’heure du clic avec les journaux Laravel et du proxy/hébergeur. Un succès du précontrôle CLI ne remplace pas la vérification du processus web.

## Protections ajoutées

- Vérification de la présence et du format de `APP_KEY`, ainsi que des anciennes clés configurées, sans afficher leur contenu.
- Middleware global avant cookies/sessions : clé absente ou invalide → réponse **503** contrôlée, sans cookie ni tentative de chiffrement, plutôt qu’une erreur répétée lors de la terminaison de la requête.
- Commande `app:preflight` : contrôle facultatif du mode production, des répertoires devant être accessibles en écriture, de la connexion/migrations et des fichiers référencés par le manifeste Vite. Aucun secret n’est généré ou modifié.
- Workflow : contrôle avant et après les migrations, cache de configuration propre à chaque release, pas de régénération de clé et correction de l’extraction de la release SCP.
- Ouverture/clôture répétables et sérialisées : un second clic sur le même état est accepté ; une autre année ouverte bloque la nouvelle ouverture.
- Modification d’année verrouillée, respect des semestres/séances existants et remplacement d’une référence à une classe d’exception inexistante.
- URL d’année non numérique refusée et erreurs métier/base de données présentées proprement.
- Erreur réseau Inertia : notification accessible et fermeture d’un éventuel indicateur de chargement. Aucune relance automatique d’une écriture : une requête interrompue peut avoir déjà été enregistrée par le serveur.
- Le préchargement Vite reste dans le HTML. Le test du dashboard compilé contrôle également que ses en-têtes `Link` restent sous 4 Ko ; aucun dépassement n’a été reproduit sur cette page.

## Seeder complet

```sh
php artisan db:seed --class=CompleteAcademicYearSeeder --force
```

Le seeder utilise l’année ouverte couvrant la date courante à Kinshasa. À défaut, il retrouve ou crée l’année d’octobre à septembre correspondante. Une année déjà clôturée ne sera pas rouverte automatiquement ; une année future ou concurrençant une autre année ouverte reste en brouillon.

Pour choisir une autre année ou un mot de passe de démonstration, renseigner les paramètres avant le lancement et vider un éventuel cache de configuration :

```dotenv
DEMO_ACADEMIC_YEAR=2026-2027
DEMO_ACCOUNTS_PASSWORD=
```

Mot de passe vide : un mot de passe aléatoire est généré pour les **nouveaux** comptes et affiché une fois dans la sortie CLI. Une relance ne modifie pas les mots de passe existants.

En local/testing, le `DatabaseSeeder` appelle également ce scénario. En production, le scénario fictif nécessite l’appel explicite de sa classe ; le seeder par défaut se limite aux rôles/permissions et codes de niveaux. Les anciens comptes à mot de passe générique ne sont plus créés automatiquement.

### Contenu du scénario

- Une année académique et deux semestres, avec périodes distinctes contenues dans les dates de l’année.
- Cinq facultés et quinze niveaux L1–L3 ; seuls les éléments manquants sont créés. Les nouvelles facultés et promotions de démonstration restent inactives sur le site public.
- 180 cours proposés : semestre, crédits sous le plafond du niveau, heures CMI/TD/TP et contenu pédagogique.
- 20 enseignants fictifs et leurs affectations aux spécialités correspondantes. Les affectations existantes sont conservées.
- Planning de toute l’année, du lundi au samedi, blocs à 8 h, 10 h, 13 h et 15 h. Les occurrences sont réparties sur le semestre ; la dernière séance peut durer une heure pour respecter exactement le volume encadré. Le calcul contrôle salles, enseignants et promotions.
- Sur une base neuve avec les volumes proposés : 15 000 heures encadrées et 7 560 séances. Les séances déjà présentes sont conservées et leur durée est déduite avant de compléter le planning. Une relance n’en ajoute pas lorsque le volume est déjà couvert.
- 45 étudiants fictifs, trois par niveau : dossiers, justificatifs illustratifs privés, activation des espaces, matricules et inscriptions académiques.
- Deux tranches de frais par étudiant, en conservant les tarifs déjà renseignés ; scénarios soldé, première tranche payée et paiement en attente. Les tarifs de référence importés correspondent au jeu de démonstration 2026–2027, sans inventer un tarif officiel pour une année future.
- Présences, retards et absences sur des séances passées uniquement ; fiches pédagogiques privées, travaux, évaluations formatives, remises et appréciations fictives liées à l’étudiant concerné.
- Traçabilité des opérations ; aucun email ni notification envoyé, aucun débit bancaire ni document académique officiel produit.

Compte d’administration fictif : `demo.admin@usk.example.test`.
Exemple d’étudiant : `demo.student.med.l1.1@usk.example.test`.
Les noms, adresses `.example.test`, notes de paiement, salles et documents identifient explicitement le scénario fictif.

Les cours personnalisés et niveaux hors du catalogue proposé sont ignorés. Un plafond de crédits incompatible ou une période ne permettant pas de placer les séances sans conflit provoque un échec explicite et une annulation des écritures de la transaction, sans suppression des données existantes.

### Exécution locale et validation

La base locale 2026–2027 a été remplie : 15 niveaux, 180 cours et affectations, 45 étudiants fictifs et **7 518 nouvelles séances**, en complément du planning déjà présent. La relance a ajouté **0 séance**.

- Test intégral sur base vierge et relance : volumes horaires, plafonds, absence de conflits, conservation des modifications, fichiers privés et absence de notifications.
- Tests ciblés des réponses HTTP, de la clé, des années/semestres, du planning, des affectations et du SEO.
- Compilation client et SSR effectuée ; contrôle ESLint du traitement des erreurs réseau.
- Test navigateur : coupure d’une soumission sans rejet non géré, fermeture du chargement, formulaire réactivé, connexion du compte fictif et chargement des années et du calendrier rempli.
- Dernière suite globale : **187 tests réussis, 22 échecs** déjà présents dans les anciens scénarios Auth/Settings/Dashboard (`User::factory()` absent, scénario d’inscription ancien) et SiteModule (200 attendu au lieu de 302). La suite globale n’est pas déclarée entièrement valide.

Références : [HTTP/2 et erreurs de messages](https://www.rfc-editor.org/rfc/rfc9113.html), [paramètres de l’action SCP utilisée](https://raw.githubusercontent.com/appleboy/scp-action/v0.1.7/action.yml). La correction de la clé est fondée sur la trace Laravel fournie et le code de chiffrement installé, pas sur le seul libellé du navigateur.
