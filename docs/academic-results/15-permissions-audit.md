# Permissions et audit

| Acteur | Accès et opérations |
| --- | --- |
| Étudiant | Résultats publiés de son dossier avec `results_view`, PDF, dépôt et suivi de recours |
| Enseignant | Notes, corrections et soumission pour validation dans ses offres, selon les droits Assessments |
| Gestionnaire de résultats | `manage academic results` et faculté autorisée. Préparation des règlements et jurys, instruction des recours |
| Jury | `deliberate academic results`, membre habilité. Décisions si présent, ouverture et approbation par le président |
| Autorité de publication | `publish official results` et faculté autorisée. Approbation réglementaire, publication, export, données certifiées et décisions de recours |

Provisionner les permissions avec le seeder de permissions, puis attribuer explicitement les habilitations selon l’organisation de l’établissement. Le rôle administrateur seul ne donne pas les droits métier. Les règles financières existantes restent la source de décision pour la consultation étudiant.

Les opérations sensibles tracent acteur, état, date, motif et référence du règlement ou de l’édition. Les instantanés et pièces privées restent hors des journaux techniques. Un export est protégé, servi sans cache partagé et neutralise les formules dans les champs textuels.
