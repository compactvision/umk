# Horaires, présences, supports et travaux

Les séances restent rattachées à `academic_offering_id`. `ScheduleService` conserve ses conflits de salle et de public et ajoute la prise en compte de toute l’équipe à la date de séance. Il utilise la période de l’offre versionnée au lieu de déduire le semestre du catalogue ; les offres anciennes gardent cette déduction. `SemesterService` contrôle également les séances rattachées explicitement au semestre. Une séance versionnée publiée et passée reste dans l’historique ; une séance avec présences ne se supprime pas.

Le contrôle de présence des offres versionnées utilise la participation à la date de séance ; l’ancien roster est conservé pour les anciennes offres. Les listes de l’espace enseignant et du détail administratif sont paginées. Les dates affichées suivent Africa/Kinshasa.

Le contrôleur des cours filtre les ressources de l’offre autorisée, distingue les ressources personnelles et pagine les listes. Les routes directes de consultation, téléchargement et dépôt conservent leur contrôle de propriétaire, publication, règles Academic Access et stockage privé. Le dépôt recontrôle l’accès pédagogique sous verrou avant écriture et refuse les offres archivées. Les dépôts restent versionnés et ne sont pas touchés par les retraits. Les résultats existants conservent leur modèle et leurs protections.

La future phase Notes peut joindre inscription annuelle, participation, offre, EC, UE, version, période et équipe. Aucune note, moyenne nouvelle, compensation, PV, bulletin, session d’examen ou délibération n’est générée ici. Les résultats officiels existants servent seulement de contexte ou de preuve de prérequis.
