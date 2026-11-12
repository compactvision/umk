# Interfaces et actions rétablies

La matrice recense 332 routes et 66 actions qui rendent directement une page Inertia à partir d’un nom littéral. Les composants correspondants sont présents. L’inventaire a confirmé cinq routes dépourvues de méthode de contrôleur au début de cette reprise.

- **Actualités.** Les URLs de création et d’édition ouvrent les modales existantes. La suppression appelle le dépôt Laravel et retourne à la liste. La recherche, les catégories, la pagination et les modifications de la galerie utilisent les données enregistrées.
- **Niveaux.** L’ancienne URL de fiche ouvre l’écran complet et conserve l’onglet demandé. La route de suppression du seul détail a été retirée. Elle n’avait ni contrôleur ni appelant et la lecture recréait automatiquement les détails. La suppression du niveau complet conserve son parcours de confirmation et protège les dépendances.
- **Dépôts pédagogiques.** Le dossier académique permet aux agents autorisés d’ouvrir les travaux de l’étudiant, de consulter leurs versions et de télécharger la pièce de la version affichée. Le parcours réutilise l’écran existant de version.

La vérification des contrôleurs ne qualifie pas les parcours dynamiques ou les opérations sans référence littérale dans la matrice. Les cas couverts et les résultats des tests sont consignés dans les documents 02 et 09.

Les formulaires Actualités enregistrent l’effacement explicite des champs facultatifs. Les contrôles d’étiquettes ont été retirés. Aucun stockage d’étiquettes n’existe dans ce module.
