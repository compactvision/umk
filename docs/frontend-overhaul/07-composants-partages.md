# Lot 2 — Composants partagés

Les écrans d’impression, de délivrance et de demandes de cartes utilisaient trois variantes du même balisage de pagination. Ils partagent désormais `CardPagination`. Les libellés, classes CSS, paramètres de recherche, URLs et options de défilement restent propres à chaque écran. La pagination par curseur de l’impression et les liens fournis par Laravel pour la délivrance et les demandes gardent leur fonctionnement.

Les écrans concernés réutilisent déjà `PageHeading` et, pour les formulaires de demande ou de retrait, `AdminModal`. Le contrôle ciblé a couvert ces parcours de cartes dans la suite Laravel. La suite frontend, le typage et le lint passent.
