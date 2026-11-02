# SEO, performance et transparence — USK

État du travail local du 2 novembre 2026. Aucun déploiement, push, branche fusionnée, service Google connecté ou suivi activé. Les informations juridiques seront fournies ultérieurement par l’établissement, conformément à la réponse du responsable du projet.

## 1. Audit initial et priorités

Stack : Laravel 12, PHP, React 19, Inertia 2, Vite 6, MySQL. Site public francophone ; aucune autre version linguistique réelle détectée. Les URL numériques existantes des facultés, niveaux et articles sont conservées.

| Priorité | Constat | Traitement |
|---|---|---|
| Critique | L’accueil utilisait une liste d’articles non filtrée par publication et date. | Filtrage des brouillons et publications futures, vérifié par tests. |
| Critique | Le workflow de déploiement régénérait APP_KEY et ignorait des échecs de migrations/caches. | Suppression de la régénération, arrêt sur erreur et exclusion du répertoire release dans rsync. Workflow non exécuté. |
| Haute | HTML initial de l’accueil : titre générique, aucun H1, aucune description ni canonical ; SSR configuré sans rendu opérationnel vérifié. | Métadonnées et contenu public en PHP, SSR public optionnel testé, hydratation adaptée. |
| Haute | Pas de sitemap, robots permissif et absence de consigne explicite de non-indexation privée. | Catalogue public dynamique, robots selon environnement et noindex des espaces techniques/privés. |
| Haute | Pages légales incomplètes et informations officielles inconnues. | Six documents en brouillon privé ; publication contrôlée, aucune déclaration de conformité. |
| Moyenne | Images lourdes, tailles non réservées, polices et CSS d’icônes provenant de tiers. | WebP responsive, dimensions/lazy loading, polices locales, retrait des chargements globaux inutilisés. |
| Moyenne | Contrastes insuffisants, quelques noms accessibles incohérents et un saut de titre. | Textes secondaires assombris dans la palette existante, boutons et hiérarchie corrigés. |
| Faible | Liens légaux dispersés, métadonnées React fragmentées, absence d’administration SEO. | Footer complet, composant central et nouvelle administration. |

Capture initiale : `mesures/etat-initial.json` (73 532 octets, titre générique, zéro H1). Aucun score Lighthouse réellement comparable avant travaux n’a été enregistré : ne pas présenter les scores suivants comme une progression avant/après. L’audit Vite de développement est conservé à titre diagnostique uniquement.

## 2. Modifications effectuées

### Rendu, exploration et métadonnées

- `app/Modules/Seo/Application/` : PublicPage, PublicCatalog, SeoRepository, PublicSsrGateway et Audience.
- `app/Modules/Seo/Infrastructure/Http/Controllers/` : contrôleurs public, administration et événements.
- `app/Models/Seo/` et migration `2026_11_02_030000_create_seo_and_legal_tables.php` : paramètres, surcharges par URL, documents juridiques et compteurs agrégés.
- `app/Http/Middleware/SeoResponse.php`, `bootstrap/app.php`, `app/Providers/AppServiceProvider.php` : noindex, absence de cache privé, en-têtes de sécurité, origine canonique optionnelle et SSR borné.
- `app/Http/Controllers/SwitchPageController.php` : rendu public centralisé, publications réellement visibles, auteurs limités aux champs publics, accueil allégé, pagination cohérente.
- Répertoire Blog : l’incrémentation des vues ne modifie plus la date éditoriale de l’article.
- `resources/views/app.blade.php`, `resources/views/seo/`, `resources/views/errors/` : métadonnées dans le HTML initial, contenu public de secours visible sans JavaScript, erreurs 404/500.
- `resources/js/components/seo/`, `resources/js/app.tsx`, `resources/js/ssr.tsx` : SEO React cohérent avec PHP, images, consentement facultatif, hydratation du SSR et résolution limitée aux pages publiques.
- `config/seo.php`, `config/inertia.php`, `.env.example` : configuration explicite. L’indexation reste bloquée en environnement local, même si une option d’administration est cochée.

Chaque page dispose de title, description, canonical, robots, Open Graph, Twitter et JSON-LD. La pagination du blog possède une canonical propre à chaque page. Les paramètres de campagne sont exclus des canonical. Les URL inconnues retournent un vrai statut 404. Aucune URL privée ne peut être ajoutée via les formulaires SEO.

Le sitemap comprend les pages publiques, facultés/niveaux actifs et articles publiés à date. Les `lastmod` sont utilisés uniquement lorsque la date métier est exploitable. Les articles n’en reçoivent pas car les anciennes vues ont pu modifier `updated_at`. Les documents juridiques, espaces privés, brouillons et pages techniques en sont exclus.

### Routes

| Route | Fonction |
|---|---|
| `/sitemap.xml` | Sitemap XML dynamique |
| `/robots.txt` | Règles d’exploration selon l’environnement |
| `/plan-du-site` | Navigation publique explorée et liste des formations |
| `/politique-de-confidentialite` | Confidentialité, publication en attente |
| `/conditions-generales-utilisation` | CGU, publication en attente |
| `/mentions-legales` | Mentions, publication en attente |
| `/politique-des-cookies` | Cookies, publication en attente |
| `/conditions-inscription` | Conditions d’inscription, publication en attente |
| `/accessibilite` | Informations d’accessibilité, publication en attente |
| `/dashboard/admin/seo` | Gestion réservée aux administrateurs vérifiés |
| `PUT /dashboard/admin/seo/settings` | Paramètres et identité officielle |
| `PUT /dashboard/admin/seo/pages` | Métadonnées d’une URL publique autorisée |
| `PUT /dashboard/admin/seo/legal/{key}` | Sauvegarde du brouillon ou publication approuvée |
| `POST /analytics/events` | Compteurs facultatifs, CSRF et limitation de fréquence |

`/politique` et `/condition` redirigent en 301 vers leurs nouvelles pages respectives. Les autres URL sont conservées. Les slugs ne sont pas introduits dans les routes numériques existantes : une migration de ces URL exigerait une stratégie distincte et des redirections testées.

### Contenu, présentation et ressources

- Pages publiques et footer : liens utiles, six liens légaux, contact cohérent avec les paramètres publics et année fournie par le serveur.
- `resources/js/pages/legal/` et `resources/js/pages/dashboard/seo/` : pages publiques d’attente, plan du site et éditeurs administratifs.
- `config/legal_drafts.php`, `database/seeders/LegalDraftSeeder.php` : textes adaptés aux fonctions existantes. Le seeder ne remplace jamais un document existant et ne publie rien.
- `resources/js/components/news/VideoPlayer.tsx` : YouTube/Vimeo ne sont contactés qu’après chargement explicitement demandé ; vidéos locales en preload none.
- `scripts/optimize-public-images.php`, `resources/js/lib/public-images.json`, dérivés WebP de huit images existantes : originaux conservés. Image académique : 505 143 octets d’origine, 65 194 octets à 1 200 pixels ; variantes de 480 et 800 pixels disponibles.
- `resources/css/fonts.css`, `public/assets/fonts/` : DM Sans et Libre Caslon Display en WOFF2 local, font-display swap, licences OFL incluses.
- CSS publics et composant de fil d’Ariane : focus visible, réduction des animations selon la préférence système, contrastes et structure de titres améliorés.
- `public/.htaccess` : compression si mod_deflate est disponible et cache des ressources statiques. Le serveur PHP de test n’applique pas ces directives Apache.
- `.github/workflows/deploy.yml` : corrections préventives du workflow, Node 22 pour le build. Aucun accès à la production effectué.
- `resources/js/components/UI/CourseCard.tsx` : correction du composant inutilisé qui contenait `return ();` et empêchait l’analyse TypeScript.

Aucun contenu de formation supplémentaire, accréditation, avis, distinction ou donnée institutionnelle fictive n’a été ajouté pour le référencement.

## 3. Tests et mesures réels

Environnement : macOS local, PHP 8.4.17, Node 24.13.1, fichiers Vite compilés, Chrome piloté par Lighthouse 13.6.0. Les mesures sont des simulations de laboratoire, sans compression HTTP du serveur PHP. Date UTC et navigateur exacts figurent dans chaque JSON.

| Page / mode compilé SSR | Performance | Accessibilité | Bonnes pratiques | SEO local | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| Accueil mobile | 75 | 95 | 100 | 69 | 8.75 s | 0.000 | 70 ms |
| Accueil ordinateur | 93 | 95 | 100 | 69 | 1.74 s | 0.002 | 0 ms |
| Admissions mobile | 74 | 100 | 100 | 69 | 6.16 s | 0.002 | 162 ms |
| Admissions ordinateur | 92 | 100 | 100 | 69 | 1.90 s | 0.002 | 0 ms |
| Formation mobile | 73 | 100 | 100 | 69 | 9.46 s | 0.001 | 131 ms |
| Formation ordinateur | 94 | 100 | 100 | 69 | 1.69 s | 0.001 | 54 ms |

Rapports JSON intégraux dans `mesures/`, avec dates UTC, environnement et détails des audits. SSR a été activé uniquement pour ces serveurs de test. Le mode compilé sans SSR a également été mesuré sur l’accueil : performance 74, LCP 9,24 s, CLS 0,011, TBT 122 ms. Le mode Vite de développement n’est pas comparable aux builds de production.


Les mesures locales ne sont pas une validation des Core Web Vitals au 75e percentile. **Le LCP mobile simulé reste au-dessus de 2,5 secondes : cet objectif n’est pas atteint.** Aucun INP réel n’est disponible ; le TBT mesuré ne doit pas être présenté comme l’INP. La compression, le cache serveur et les mesures sur l’hébergement réel restent essentiels avant de conclure.

Le score SEO 69 est lié au blocage volontaire par robots/noindex en local. Le retirer pour obtenir une meilleure note exposerait inutilement le site. L’accueil conserve un signalement automatisé de contraste sur le filigrane décoratif USK, déjà marqué aria-hidden ; ce point reste à contrôler manuellement. Les résultats d’accessibilité automatisés ne prouvent pas la conformité WCAG 2.2 AA ; une vérification manuelle au clavier, lecteur d’écran et des contenus complets reste nécessaire.

### Vérifications fonctionnelles

- Dernière sélection ciblée : **45 tests réussis, 556 assertions**. SEO, consentement/compteurs, administration, parcours d’inscription et actualités.
- Vérifications complémentaires du catalogue et des prix : une sélection de 48 tests a également passé avant l’ajout des derniers cas de garde.
- Dernière suite globale exécutée : **177 réussites, 22 échecs, 5 967 assertions**. Échecs dans les anciens tests Auth/Settings/Dashboard utilisant `User::factory()` absent, le test de création de compte utilisant les anciens champs et le test SiteModule attendant 200 au lieu de 302. La suite globale n’est donc pas déclarée verte.
- `npm run build:ssr` : compilation client et serveur réussie après les corrections finales.
- ESLint des nouveaux composants SEO/légaux et de leurs intégrations : réussi.
- `npm run types` : échec global, 349 diagnostics dans les composants existants, notamment Sidebar et anciens écrans blog/professeur. Aucun diagnostic relevé dans les nouveaux fichiers SEO/légaux ; cela ne constitue pas une validation TypeScript globale.
- Exploration HTTP des 18 URL du sitemap local : statut 200, un H1, langue française, canonical et JSON-LD présents, SSR rendu et aucun titre dupliqué. Preuve dans `mesures/exploration-locale.json`.
- Tests supplémentaires : publications futures/brouillons exclus, pagination propre, erreurs 404, redirections 301, étudiant interdit dans l’administration SEO, surcharges privées rejetées, panne SSR avec fallback et publication juridique incomplète bloquée.
- Syntaxe JSON-LD vérifiée en local. Les validations Google Rich Results Test et Schema Markup Validator externes ne sont pas déclarées effectuées.

## 4. Pages légales et informations en attente

Les six routes sont accessibles, mais les visiteurs voient uniquement un message de validation en cours. **Les brouillons ne sont pas transmis dans les propriétés publiques.** Les six textes sont enregistrés en base locale, statut draft, sans approbation.

Informations à fournir : domaine de production ; forme juridique ; enregistrement et informations réglementaires ; responsable de publication ; hébergeur et coordonnées ; contact protection des données ; bases juridiques applicables ; prestataires, lieux de traitement et transferts ; règles pour les mineurs ; conservation/archivage des dossiers et des traces ; annulation, désistement et remboursement ; modalités de règlement des litiges. La configuration des sessions et les marqueurs `[[...]]` doivent aussi être vérifiés dans chaque texte.

La publication exige les champs officiels complets, l’absence de marqueurs non remplacés et une approbation explicite de la direction. Ces contrôles techniques ne remplacent pas une validation juridique locale en RDC. Aucun agrément, numéro, délai de remboursement ou conformité réglementaire n’a été inventé.

Les coordonnées déjà présentes correspondent aux informations du site officiel consulté : N° 44 avenue Bongolo, Kauka, Kalamu, Kinshasa ; +243 894 465 813 ; contact@universitesk.net. Elles restent à confirmer pour l’exploitation finale du projet.

## 5. État du SEO technique et de la confidentialité

- Métadonnées servies en PHP et mises à jour lors des navigations Inertia ; JSON-LD CollegeOrUniversity, WebSite, WebPage, BreadcrumbList et Course/NewsArticle selon le contenu réel.
- Français explicitement déclaré sur les pages publiques ; pas de hreflang sans autres versions réelles.
- Sitemap et plan du site dynamiques, publications et niveaux actifs uniquement.
- Local : robots Disallow / et pages noindex. Production : indexation publique possible uniquement après opt-in ; espaces privés toujours exclus et protégés par les autorisations existantes.
- Domaine canonique à définir ; redirection vers l’origine principale uniquement si SEO_ENFORCE_ORIGIN est activé. Vérifier HTTPS et les proxys de confiance avant son activation.
- SSR désactivé par défaut, fonctionnement local complet testé. Une panne du service revient au contenu public PHP, avec délais de connexion et réponse bornés. Les pages privées ne sont jamais envoyées au rendu SSR.
- Aucun Google Analytics ou Tag Manager ajouté. Aucune mesure d’audience activée en base.
- Mesure interne facultative préparée : compteurs par jour/événement/chemin public, sans compte, IP, email, dossier, chaîne de requête ou identifiant persistant enregistré dans la table. Sources classées seulement en direct/recherche/social/référent. Les demandes effectivement soumises sont comptées côté serveur uniquement si la mesure et le consentement sont actifs.
- Activation de cette mesure bloquée tant que confidentialité et cookies ne sont pas publiés et approuvés. Acceptation/refus au même niveau ; choix accepté/refusé dans le cookie usk_audience pendant environ six mois ; bouton de gestion dans le footer lorsque la fonction est activée. Aucune bannière facultative inutile lorsqu’elle est désactivée.
- Les journaux techniques de l’hébergement sont distincts des compteurs applicatifs et devront figurer dans l’analyse de conservation.

## 6. Actions manuelles avant publication

1. Compléter les informations officielles dans **Administration → Référencement**, faire relire et approuver les six documents. Le responsable du projet fournira les éléments plus tard.
2. Définir le domaine HTTPS et vérifier certificat, renouvellement, www/non-www et proxys sur l’hébergement retenu. L’état du certificat de la future application n’a pas pu être vérifié en local.
3. Préparer une copie de sauvegarde et valider les migrations sur un environnement de recette. Conserver APP_KEY ; ne jamais la régénérer lors d’une release.
4. Configurer la compression et le cache de fichiers statiques sur le serveur réel. Refaire Lighthouse mobile/ordinateur et analyser le LCP, les chaînes CSS/JS, les payloads et les images restantes.
5. Si Node persistant est disponible : lancer `npm run build:ssr`, superviser `node bootstrap/ssr/ssr.js`, puis activer INERTIA_SSR_ENABLED sur l’environnement validé. Sinon garder le rendu PHP de secours ; ne pas activer SSR sans supervision.
6. Créer la propriété Search Console du domaine réel, vérifier par DNS ou jeton, saisir le jeton dans l’administration si nécessaire, puis soumettre /sitemap.xml. Contrôler exploration, indexation, pages exclues, requêtes et CWV. Aucun accès à cette propriété n’a été fourni.
7. Après validation explicite de mise en ligne, autoriser l’indexation publique. Contrôler les réponses réelles, robots et canonical avant la soumission Google. Aucun déploiement n’est autorisé par ce rapport.
8. Décider si la mesure interne est utile, valider sa conservation et ses textes avant activation. Les totaux sont des événements agrégés, pas des visiteurs uniques ni un outil d’attribution individuel. Aucun outil externe n’est requis pour le fonctionnement.
9. Faire contrôler l’accessibilité manuellement et résoudre les tests historiques/erreurs TypeScript avant une validation globale de production. Refaire un audit des dépendances.

Configuration disponible : SEO_SITE_URL, SEO_INDEXABLE, SEO_ENFORCE_ORIGIN, GOOGLE_SITE_VERIFICATION, INERTIA_SSR_ENABLED, INERTIA_SSR_URL. VITE_USE_BUILD=true permet une mesure locale des fichiers compilés sans arrêter Vite. Une surcharge enregistrée en administration prend le pas sur le défaut SEO de configuration ; vérifier les deux avant le lancement.

Pour les nouveaux environnements : migration habituelle, puis `php artisan db:seed --class=LegalDraftSeeder` pour préparer les brouillons sans écraser les versions déjà rédigées.

## 7. Recommandations classées par impact

**Priorité haute :** mesurer le LCP mobile avec compression sur l’hébergement cible ; finaliser l’identité et les règles juridiques ; corriger les tests globaux et la dette TypeScript ; superviser le SSR si retenu ; vérifier Search Console et les accès privés en recette.

**Priorité moyenne :** enrichir les formations avec les informations pédagogiques officiellement validées, retirer ou identifier les propositions de démonstration avant publication, ajouter des liens éditoriaux pertinents entre actualités et formations, poursuivre la réduction CSS/JS et optimiser les médias téléchargés par les éditeurs. Vérifier manuellement contrastes, clavier, zoom et lecteur d’écran.

**Priorité complémentaire :** préparer la fiche Google Business Profile si l’établissement est éligible, avec les mêmes coordonnées et de véritables horaires. Ne publier que des profils, événements et contenus institutionnels validés. Ajouter des versions linguistiques uniquement lorsqu’un contenu maintenu existe réellement.

### Références consultées

- [Google : référencement des sites JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Inertia 2 : rendu serveur](https://inertiajs.com/docs/v2/advanced/server-side-rendering)
- [Core Web Vitals : mesures terrain et seuils](https://web.dev/articles/vitals)
- [Site officiel de l’Université Simon Kimbangu](https://universitesk.net/)
- [ARE : ordonnance-loi portant Code du numérique de la RDC](https://are.gouv.cd/download/ordonnance-loi-23-010-du-13-mars-portant-code-du-numerique/)
- [ADN : textes légaux et réglementaires](https://adn.cd/fr/ressources/textes-legaux-et-reglementaires)

Les références juridiques servent au cadrage de brouillons ; aucune conformité complète n’est déduite de leur seule consultation.
