# Moteur de calcul

`ResultCalculator` version 1 utilise des fractions exactes. Pour chaque source, il multiplie la note par l’échelle réglementaire et divise par le barème source. La moyenne d’EC est la somme des valeurs normalisées multipliées par leur poids, divisée par la somme des poids déclarés.

Une UE agrège les EC chiffrés selon la méthode du règlement. Les moyennes de période et d’année utilisent les UE chiffrées sans réutiliser leurs valeurs arrondies. La méthode uniforme donne le même poids aux EC puis aux UE. La méthode par crédits utilise les crédits de l’EC puis ceux de l’UE. La méthode par coefficients utilise les coefficients de l’EC puis la somme des coefficients des EC chiffrés de l’UE. Les équivalences sans note ne contribuent pas numériquement.

La précision est appliquée à l’affichage seulement. Les seuils utilisent la fraction exacte. Une source ou un poids indispensable manquant rend l’UE et sa moyenne de période incomplètes. La moyenne annuelle reste indisponible tant que le dossier est incomplet. Le calcul conserve les références aux enveloppes et la version du moteur. Les états officiels restent figés après publication.
