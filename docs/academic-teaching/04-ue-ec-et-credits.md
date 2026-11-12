# UE, EC, crédits et coefficients

Les `curriculum_units` regroupent les `curriculum_items` d’un niveau et d’une période configurée par la version. Une matière ne peut apparaître deux fois dans une version ; l’EC et son unité partagent le propriétaire de version imposé par FK composite. Le service vérifie niveau, période et codes normalisés : UE dans version/niveau/période, EC dans son UE. Un code EC absent reste autorisé pour compatibilité.

Le champ `is_optional` de l’EC est éditable dans le brouillon, visible en lecture dans l’éditeur, conservé à la copie et dans la comparaison. Le modèle protège les données d’une maquette validée/publiée. Les signatures de revue gardent leur représentation historique pour les valeurs par défaut et tiennent compte des choix nouveaux.

Deux contrôles par UE : `sum` (compatibilité : comparer somme des EC aux crédits attendus s’ils sont renseignés) et `independent` (crédits UE définis séparément). Un total indépendant non renseigné reste indéterminé dans le dossier. La version conserve son mode crédits, coefficients ou les deux ; les coefficients et volumes sont contrôlés par le workflow existant. Aucun calcul de compensation ou de notes ajouté.

Le portail affiche « crédits prévus » pour une référence du catalogue et « crédits inscrits » pour une participation effective. Ces crédits ne valent pas acquisition. Les décisions UE existantes restent la source des crédits acquis disponibles au dossier, sans calcul nouveau de décision de jury.
