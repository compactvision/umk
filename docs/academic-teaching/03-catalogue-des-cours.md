# Catalogue des matières

`Courses` conserve identifiant et rattachement au niveau historique, code, titre, description, domaine facultatif, contenu pédagogique, volumes CMI/TD/TP et crédits/semestre indicatifs. Les crédits officiels du parcours proviennent de l’EC de la version retenue.

- `GET /dashboard/admin/course-catalog` : recherche nom/code, filtres faculté, niveau, semestre indicatif, statut, pagination 25.
- `GET /dashboard/admin/course-catalog/{course}` : fiche, maquettes utilisatrices et offres avec nombres de séances et ressources. Deux listes paginées.
- Routes existantes de création et modification par niveau conservées. La fiche ajoute `PUT /course-catalog/{course}` et `POST /course-catalog/{course}/status`, avec motif, permission et faculté vérifiés.

`CourseCatalog` verrouille le niveau avant contrôle du plafond historique de crédits et contrôle des codes normalisés (espaces externes, casse). Les nouveaux codes reçoivent une clé unique par niveau. Les données anciennes, y compris d’éventuels doublons, gardent leurs identifiants et codes ; un code nouveau ou modifié ne peut créer un doublon.

Une matière peut être active, inactive ou archivée. Inactive : pas de nouvelle offre ni de nouvelle insertion dans un brouillon ; elle reste dans les relations déjà établies. Archivée : fiche historique en lecture, sans suppression de la matière ou de ses offres. Les maquettes gardent les libellés, heures et crédits figés. Les anciennes offres sans EC continuent de lire le libellé courant du catalogue ; elles ne disposent pas d’un instantané rétroactif.
