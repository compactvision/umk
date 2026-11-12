# Types et barèmes

Les catégories sont définies dans `config/assessment.php`. Les catégories initiales couvrent devoirs, TP, TD, projets, interrogations, contrôle continu et examens. La modalité de remise ou de présence reste indépendante de la catégorie. Le code de session est configurable dans le formulaire et permet des sessions ordinaires, des rattrapages et d’autres périodes.

Les points sont des entiers en centièmes. Le formulaire accepte au plus deux décimales avec virgule ou point et rejette une précision supérieure, sans arrondi implicite. Le barème maximal est positif, au plus 10 000 points. Une grille facultative exige des critères positifs distincts dont la somme égale le maximum. L’absence de maximum signifie appréciation qualitative. La pondération indicative est un pourcentage décimal de 0 à 100, distinct du coefficient de la maquette.

Le barème, la grille, le mode de correction et l’audience deviennent immuables après publication ou constitution d’un groupe. Les changements autorisés du barème en brouillon sont tracés avec leur motif. Les calculs officiels sont réservés au domaine Results.
