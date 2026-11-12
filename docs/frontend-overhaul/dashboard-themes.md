# Thèmes du dashboard USK

La feuille CSS du [site public USK](https://usk.axumindustries.com/) confirme le vert institutionnel `#073E32`, le vert profond `#062C25`, l’or `#E6C470` et le papier `#F7F5EF`. La typographie associe DM Sans et Libre Caslon Display. Les styles existants fournissent les valeurs du mode clair.

Le thème nuit définit des variables sémantiques dans [night.css](../../resources/css/dashboard/night.css).

| Usage | Couleurs |
| --- | --- |
| Fond, surface et surface élevée | `#0D151D`, `#15232C`, `#1C2D35` |
| Texte et texte secondaire | `#EEF4ED`, `#B2C5BD` |
| Bordures de surface et de champ | `#374E50`, `#63827C` |
| Bouton principal et accent vert | `#205C47`, `#91D8AE` |
| Or institutionnel | `#E6C470` |
| Alertes et information | `#FFB7AD`, `#B1CCE0` |

Les feuilles CSS des modules utilisent ces variables avec les couleurs claires existantes en repli. La navigation, les modales, les notifications, les formulaires, les tableaux, les états de chargement et les graphiques héritent des mêmes rôles. Les couleurs des cartes étudiantes destinées à l’impression appartiennent au modèle de carte.

Le [sélecteur du dashboard](../../resources/js/components/layouts/Dashboard/DashboardThemeMenu.tsx) utilise Radix pour le clavier et les choix exclusifs. Le [hook](../../resources/js/hooks/use-dashboard-theme.ts) lit `usk-dashboard-theme` dans `localStorage`, suit le système par défaut et écoute les changements de préférence entre onglets. Si le navigateur bloque le stockage, la préférence reste disponible en mémoire jusqu’au rechargement. Le document initial du dashboard prépare le fond avant le rendu de React. Les transitions du sélecteur respectent la préférence de réduction des animations.

Les variables du thème nuit sont actives uniquement tant que la racine du dashboard authentifié est montée. Cette portée couvre aussi les dialogues et les notifications rendus dans des portails. Les pages publiques et l’authentification conservent leur thème habituel.

## Fichiers concernés

- `resources/css/dashboard/night.css` définit les tokens, le sélecteur et les adaptations des utilitaires Tailwind 4.
- `resources/js/components/layouts/Dashboard/` applique le thème et présente le sélecteur dans les en-têtes. `resources/js/hooks/use-dashboard-theme.ts` gère la préférence.
- `resources/css/dashboard/` et les feuilles des admissions, candidatures, du portail étudiant et du chargement réutilisent leurs couleurs claires comme valeurs de repli.
- `resources/views/app.blade.php` prépare le fond initial uniquement pour une réponse du dashboard authentifié.

## Vérification

Chrome a chargé 66 écrans en clair et en sombre, répartis entre administration (41), espace étudiant (20), enseignement (3) et candidature (2). Le contrôle interactif a couvert les trois préférences, les changements du système, le stockage entre deux onglets, le rechargement, le clavier, le mouvement réduit, l’affichage mobile, la navigation Inertia, les notifications, une modale, une erreur de validation serveur et une coupure réseau simulée. La capture de l’accueil public était identique avant et après activation du sombre. Huit autres pages publiques et la connexion ont été contrôlées.

Les builds navigateur et SSR, TypeScript, ESLint, les 78 tests frontend et 20 tests Laravel ciblés (SEO et navigation du dashboard) ont réussi.

Les couples de tokens texte/surface principaux, texte secondaire/surface élevée et bouton primaire/texte donnent respectivement des contrastes de 14,36:1, 7,87:1 et 7,52:1. Ces mesures ciblées ne constituent pas un audit WCAG complet. Les contrôles interactifs ont été effectués dans Chrome, avec des données locales de test.

Les vérifications Safari et Firefox, les corrections de contraste et les résultats détaillés figurent dans le [rapport d’audit WCAG](dashboard-wcag-audit.md).
