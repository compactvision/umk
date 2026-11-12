# Parcours dans l’interface

- Enseignant. Ouvrir une offre dans l’espace enseignant, puis Ressources pédagogiques. La bibliothèque propose les sections, les brouillons, la publication, l’archivage et l’historique en fonction des droits.
- Étudiant. Depuis Mes cours, choisir Fichiers, Cours en ligne, Vidéos ou Évaluations. Les ressources sont regroupées par section. Le détail de séance et le devoir ouvrent les supports associés lorsque ceux-ci sont accessibles.
- Administration. Depuis Enseignements, ouvrir Ressources pédagogiques et filtrer par année, faculté, programme, cours, enseignant, type ou état. Ouvrir un support pour vérifier son édition, ses dates, la disponibilité du fichier et son historique.

Les modales existantes gèrent l’attente et les erreurs de formulaire. Les listes paginées affichent un état vide. Les médias locaux compatibles utilisent les contrôles natifs du navigateur. Le PDF et les images s’ouvrent dans le lecteur du navigateur. Une ressource non publiée répond par une absence côté étudiant. Un fichier devenu indisponible après le chargement de la page entraîne une réponse HTTP 404 à l’ouverture.

La notification est facultative lors de la publication. Elle ouvre la rubrique de cours et n’inclut pas de nom de fichier ni de chemin. La mise en file des notifications utilise le système Laravel existant si `LEARNING_CONTENT_QUEUE_NOTICES` est activé et que les workers sont opérationnels.
