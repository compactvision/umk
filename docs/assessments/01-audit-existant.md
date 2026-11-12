# Audit avant intervention

| Domaine | État | Constat et incidence |
| --- | --- | --- |
| Cours, maquettes et inscriptions | Opérationnel | Les offres versionnées et inscriptions pédagogiques définissent l’audience et la référence UE ou EC. Les offres historiques coexistent. |
| Ressources, devoirs et évaluations | Partiel | `AcademicResource` porte les consignes, les dates, la publication, la séance et les supports associés. Aucun barème ni état de correction n’était associé. |
| Remises | Partiel | `AcademicSubmission` a une ligne courante unique par ressource et inscription. Les versions précédentes figuraient dans l’audit avec leur texte et leur chemin. La route de remise ne disposait pas d’un identifiant de rejeu. |
| Fichiers | Partiel | Stockage local privé et contrôles de fichiers existants. La route administrative des copies exigeait une permission de publication mais omettait le périmètre facultaire de l’offre. |
| Examens et présence | Partiel | Planning, conflits de salle, présences et justifications existants. Une épreuve ne disposait pas de workflow de correction. |
| Résultats | Partiel | Les résultats personnels publiés et les résultats d’UE existaient indépendamment. Aucun flux de correction pédagogique versionné ne les alimentait. |
| Groupes de travail et correction | Absent | Les groupes administratifs n’offraient pas de composition de travail figée, de note collective ou d’ajustement individuel. |
| Notifications et files | Réutilisable | Notifications en base et files Laravel configurables. Les travailleurs et S3 de l’infrastructure cible restent à vérifier. |
| Performance | À mesurer | Les remises étaient sérialisées par un verrou exclusif sur l’offre. Le nouveau chemin utilise des verrous partagés pour la configuration et un verrou exclusif par dossier. |

Baseline exécutée avant les modifications sur SQLite en mémoire. 339 tests PHP ont réussi, soit 153 112 assertions. [Sortie de la suite initiale](evidence/baseline.txt)
