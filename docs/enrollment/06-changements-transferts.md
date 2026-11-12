# Changements et transferts

`POST /dashboard/admin/student-academic/{academic}/transfer` appelle `AcademicEnrollmentService::transfer`. Permissions cumulées : `manage academic access` et `publish academic content`. Source et destination doivent appartenir au périmètre de l’agent.

La source doit être confirmée, suspendue ou en congé, dans une année ouverte. La destination doit posséder un niveau actif et une maquette publiée d’un programme disponible. `CurriculumService::bind` vérifie année, niveau et cohorte. Toute erreur annule l’opération entière.

La cible est un **nouveau contexte en attente de confirmation**, lié au même profil, à la même admission et au même matricule. La source devient `transferred` et conserve son niveau, son programme, sa maquette, ses groupes, résultats, obligations et paiements. Le registre contient auteur, motif, avant/après et cible. Aucun report financier automatique : la comptabilité examine les frais et crédits selon ses propres services.

Les changements de groupe et de département compatibles avec le niveau utilisent les décisions ordinaires. Ils conservent les anciennes valeurs dans le registre et ne suppriment aucune séance, présence ou soumission.

`EnrollmentMembershipHistory` reconstruit les intervalles des affectations historisées. `AcademicAccessService::sessions` utilise l’affectation à la date de début de la séance : le passé de l’ancien groupe reste consultable et le futur du nouveau groupe apparaît. Une séance d’un groupe auquel l’étudiant n’appartenait pas à cette date reste exclue. Le portail, l’accueil, la page de cours et les statistiques de présences réutilisent cette requête. Les ressources, téléchargements, devoirs et évaluations continuent à utiliser les droits courants ; consulter une ancienne séance ne réactive pas les fichiers privés de l’ancien groupe. Les contextes issus d’un transfert ne reçoivent pas de séances antérieures à leur date d’effet.

La réorientation vers un autre programme au même niveau est désormais possible via la réservation versionnée décrite dans `02-modele-inscription-annuelle.md`. Un simple changement de maquette dans le même programme/niveau reste refusé par ce workflow : la référence historique ne doit pas être remplacée sous couvert d’un transfert.

Le formulaire peut lier la demande étudiante examinée et transmettre sa réponse. Les motifs internes ne sont pas réutilisés automatiquement comme réponse publique.

Limites : les affectations anciennes sans décision exploitable ne sont pas reconstituées artificiellement ; les exceptions de cours continuent à suivre leurs règles courantes. Les doubles cursus, transferts interuniversitaires et transferts entre campus ne sont pas activés. Le référentiel ne contient pas encore d’entité Campus.

La capacité des groupes est maintenant configurable sur `POST /dashboard/admin/student-academic/groups/{group}/capacity`. `AcademicGroupService` verrouille le groupe, contrôle le périmètre et refuse une capacité inférieure à l’occupation annuelle existante. Aucun étudiant n’est déplacé automatiquement. Le changement est audité et son rejeu sans modification ne produit pas une seconde trace.
