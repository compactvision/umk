# Lot 1 — Layout partagé du tableau de bord

Le conteneur partagé occupe la largeur disponible après la marge réservée à la sidebar. Le layout et la sidebar utilisent le même état responsive, établi avec le seuil Tailwind `md` de 48 rem. Les marges internes, couleurs, typographies, composants et limites propres aux formulaires sont conservés.

Chrome a vérifié les dimensions du conteneur partagé à 375, 767, 768, 1024, 1440 et 1920 px dans quatre configurations représentatives (administration, étudiant, enseignant et authentification). Les 24 mesures passent, y compris l’absence de débordement horizontal dans ces scénarios. À 768 px, le contenu du tableau de bord dispose de 688 px après la sidebar de 80 px. Le conteneur d’authentification reste limité à 480 px.

Le contrôle Chrome isole le composant de layout rendu avec les styles compilés et des doublures pour l’en-tête, la sidebar et le contenu métier. Le responsive des écrans complets et les interactions du menu mobile restent à vérifier.
