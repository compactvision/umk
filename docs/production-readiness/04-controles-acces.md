# Contrôles d’accès

| Acteur | Autorité côté serveur | Contrôle de recette |
| --- | --- | --- |
| Candidat | Authentification et propriété de candidature et de pièces | Refuser l’accès à une pièce d’un autre candidat. |
| Étudiant | Rôle étudiant, contexte d’inscription propriétaire et règles d’accès par service | Refuser lecture de notes, archives, dossier financier ou pièces d’un tiers. |
| Enseignant | Affectation et rôle pédagogique dans Teaching et AssessmentAccess | Refuser les écritures hors offre et vérifier la liste d’étudiants autorisée. |
| Scolarité | `manage academic access` et périmètre de faculté | Séparer confirmation d’inscription, publication et finance. |
| Finance | `manage academic finance` et politique du dossier | Refuser l’usage de cette permission seule pour un jury ou l’émission. |
| Jury | Permissions Results et composition de la séance | Vérifier le rôle, la présence et l’état de la délibération. |
| Documents | Habilitations de préparation, approbation, émission et diplôme | Refuser une émission directe par un étudiant ou un agent hors périmètre. |
| Progression | Permissions de proposition et d’approbation, plus habilitation de diplomation | Refuser l’auto-approbation et l’approbation d’une révision périmée. |
| Public | Références opaques pour vérifier le statut, routes signées là où elles sont prévues | Exclure fichiers privés et données personnelles du registre public. |

Les 334 routes ont été inventoriées. Les deux chemins d’authentification sous `dashboard/` sont publics par conception. La revue de production doit vérifier les attributions effectives, notamment les agents sans faculté affectée et les comptes techniques.
