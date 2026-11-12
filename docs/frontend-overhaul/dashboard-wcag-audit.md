# Audit d’accessibilité du dashboard USK

Référentiel : [WCAG 2.2, niveaux A et AA](https://www.w3.org/TR/WCAG22/). Périmètre : dashboard authentifié, en clair et en sombre, avec les rôles administrateur, étudiant, enseignant et candidat. Les contrôles utilisent une base locale de test.

## Mesure et corrections

Le premier passage axe-core 4.14.0 a porté sur 22 écrans dans les deux thèmes. Il a relevé 728 occurrences sur les 44 combinaisons écran/thème. Un même élément partagé peut être compté sur plusieurs écrans.

| Critère WCAG | Constat | Correction |
| --- | --- | --- |
| 1.4.3 Contraste du texte | 611 occurrences, principalement des textes secondaires trop clairs en mode clair. | Couleurs de texte, d’accent et d’erreur USK foncées sur les surfaces claires. Noms de faculté et pagination lisibles en sombre. |
| 1.4.10 Redistribution et 1.4.12 Espacement du texte | Le lien public de l’en-tête dépassait à 320 px avec l’espacement de texte augmenté. | Icône avec nom accessible à cette largeur, en-tête redimensionnable et défilement limité au graphique si nécessaire. |
| 1.4.11 Contraste des éléments non textuels | Bordures de champs trop discrètes sur les surfaces claires. | Bordures renforcées et état invalide distinct dans les formulaires du dashboard. |
| 2.4.1 Contourner les blocs et 2.4.7 Focus visible | Accès répétitif au menu avant le contenu, styles de focus hétérogènes. | Lien d’évitement affiché au focus et indicateurs clavier dans les deux thèmes. |
| 2.5.3 Étiquette dans le nom | 112 occurrences liées aux libellés du menu et aux mois abrégés des finances. | Le nom accessible reprend le texte visible. L’année et le libellé complet du mois restent disponibles. |
| 2.5.8 Taille minimale de la cible | Quatre occurrences sur des liens étudiants et des cibles de mois sous 24 px sur mobile. | Cibles de 24 px et défilement horizontal local du graphique. |
| 3.3.2 Étiquettes ou instructions | Deux filtres d’actualités sans nom. | Nom explicite pour la catégorie et le statut. |
| 4.1.2 Nom, rôle et valeur | Une occurrence de rôle interne non standard sur la barre de progression Inertia. | Barre décorative masquée à l’arbre d’accessibilité pendant le chargement du dashboard, avec l’annonce de chargement existante. |

Le passage élargi a couvert 66 écrans dans les deux thèmes (132 combinaisons). Il a relevé 168 occurrences supplémentaires de contraste et quatre occurrences pour les deux filtres d’actualités. Après correction, les 19 écrans concernés ou de contrôle, rejoués en clair et en sombre, n’ont donné aucune violation automatique sur les 38 vérifications. Les badges d’actualité choisissent le texte noir ou blanc selon le contraste calculé avec leur couleur de catégorie. Huit contrôles dédiés ont confirmé les corrections de nom et de rôle sur les groupes des facultés et des calendriers.

Le contrôle à 320 px a couvert six écrans dans les deux thèmes avec hauteur de ligne à 1,5, espacement des lettres à 0,12 em, espacement des mots à 0,16 em et marge de paragraphe de 2 em. Le graphique financier conserve des cibles de 24 px et défile dans sa propre zone.

## Navigateurs

- Safari 27.2 natif, fenêtre privée : passage clair → sombre → clair au clavier sur les finances et conservation du thème sombre après actualisation.
- Firefox 159.0 via Playwright : clair, sombre, système, clavier, actualisation, contrôle à 320 px et absence des tokens du thème sur l’accueil public.
- WebKit 27.2 via Playwright : mêmes contrôles automatisés sur les finances et l’accueil.
- Chrome : axe-core sur les vues testées, lien d’évitement et redistribution à 320 px avec espacement du texte augmenté.

Le build, TypeScript, ESLint, les 78 tests frontend et les 20 tests Laravel ciblés sont passés.

Les résultats portent sur les vues et états testés. Une déclaration de conformité pour l’application entière demande aussi des vérifications manuelles par parcours, notamment avec un lecteur d’écran, sur les textes superposés aux images ou dégradés et sur les contenus fournis par les utilisateurs.
