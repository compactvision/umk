# Audit de départ

| Périmètre | Constat dans le dépôt |
| --- | --- |
| Enseignements | Les offres historiques et les offres issues des maquettes publiées coexistent. Les inscriptions pédagogiques, les groupes et les équipes d’enseignement ont leurs services propres. |
| Supports | `AcademicResource` regroupait documents, liens, vidéos, annonces, devoirs, évaluations et résultats. La visibilité reposait sur `is_published`. |
| Fichiers | Les téléversements académiques utilisaient le disque `local` et les ressources persistaient le disque, le chemin, le nom et le MIME. Les routes étudiant et enseignant vérifiaient des droits avant lecture. |
| Organisation | Les onglets cours en ligne, fichiers, évaluations et vidéos existaient déjà. Les supports ne possédaient ni section, ni lien vers une séance, ni historique d’édition. |
| Travaux | `AcademicSubmission` gérait déjà les dépôts privés et leur historique. Les résultats individuels et pièces de dossier avaient leurs parcours propres. |
| Diffusion | La configuration Laravel déclare S3. Le dépôt ne fournit pas de preuve d’un compartiment privé en service ni d’un adaptateur AWS installé. |

La suite PHP initiale a donné 329 tests réussis et 152 845 assertions sur SQLite en mémoire. Le détail figure dans [la baseline](evidence/baseline.txt).
