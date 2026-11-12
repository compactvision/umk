# Permissions et routes

| Rôle | Lecture | Écriture |
| --- | --- | --- |
| Étudiant | Offre autorisée, support publié, règles du dossier et droits du travail associé | Dépôt de travail dans son parcours existant |
| Enseignant principal ou intervenant | Offres affectées. Brouillons et versions dans les offres gérables | Affectation active, permission `manage courses`, année ouverte, offre non archivée |
| Assistant ou enseignant en lecture | Supports publiés de ses offres | Aucune mutation de la bibliothèque |
| Administration | Ressources et historique de son périmètre, permission `publish academic content` | Même périmètre, année en brouillon ou ouverte et offre non archivée |

Les points d’entrée étudiant utilisent `AcademicAccessService` pour l’offre et les conditions pédagogiques et financières. Le service enseignant vérifie le compte lié et l’affectation actuelle. Le périmètre facultaire administratif est fourni par `TeachingScope`. Les ressources nominatives restent dans leurs parcours existants.

| Méthode | Chemin relatif | Usage |
| --- | --- | --- |
| GET | `/` | Liste paginée et historique sélectionné |
| POST | `/offerings/{offering}` | Déposer une ressource |
| POST | `/offerings/{offering}/sections/{section?}` | Créer ou réordonner une section |
| POST | `/{resource}/edition` | Modifier une ressource ou remplacer son fichier |
| POST | `/{resource}/publication` | Publier, retirer ou archiver |
| POST | `/{resource}/reuse` | Réutiliser une édition |
| POST | `/{resource}/work-placement` | Placer un devoir ou une évaluation |
| GET | `/{resource}/file`, `/{resource}/preview`, `/{resource}/versions/{number}` | Télécharger ou prévisualiser selon les droits |

Ces routes s’appliquent aux préfixes `/dashboard/teacher/resources` et `/dashboard/admin/teaching/resources`. L’étudiant utilise `GET /dashboard/student/courses/{course}/{section?}` et `GET /dashboard/student/resources/{resource}/download` ou `preview`. Les mutations passent par la protection CSRF du groupe web.
