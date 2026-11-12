# Migration des données existantes

La migration `2026_11_04_180000_add_versioned_academic_structure` crée dix tables et ajoute des clés étrangères nullables à quatre tables existantes. Elle ne modifie aucune valeur métier ni identité historique et ne déduit aucun programme, aucune cohorte et aucune maquette à partir des libellés.

Pour une mise en service ultérieure :

1. Sauvegarder et tester la restauration sur une copie autorisée. Vérifier le moteur et ses verrous DDL avec la taille réelle.
2. Migrer le schéma additif et vérifier les comptages, clés et parcours existants.
3. Saisir l'identité officielle et associer le Site ; rattacher les facultés et années validées.
4. Configurer cycles, programmes, niveaux et éventuellement cohortes et promotions. Publier les maquettes vérifiées.
5. Examiner les dossiers historiques sans maquette. N'attribuer une version qu'après preuve de son applicabilité et décision motivée.

Le test de migration vérifie des lignes anciennes avant/après et la suppression du nouveau schéma seulement lorsqu'il est vide. Le rollback de schéma refuse une structure déjà configurée. Pour un retour de version applicative, garder le schéma et les références, vérifier la compatibilité du code précédent et préparer un correctif en avant si nécessaire. Aucun déploiement ni migration sur la base existante n'a eu lieu dans cette intervention.
