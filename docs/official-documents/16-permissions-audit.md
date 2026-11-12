# Permissions, périmètres et audit

| Acteur | Habilitation | Actions |
| --- | --- | --- |
| Étudiant | Rôle et inscription lui appartenant | Déposer et suivre les demandes permises, compléter une demande, consulter ses PDF autorisés |
| Gestionnaire | `manage official documents` | Catalogue, nouvelle version, dépôt interne, contrôle, correction et refus |
| Approbateur | `approve official documents` | État du catalogue, approbation du modèle par le signataire désigné, approbation de demande |
| Signataire de diplôme | Approbation et `approve academic diplomas` | Valider les modèles et demandes de diplôme relevant de son périmètre |
| Émetteur | `issue official documents` | Émission, impression, remise et révocation |
| Public | UUID du registre | Consulter le statut minimal |

Les habilitations documentaires administratives requièrent le rôle admin. Les affectations académiques restreignent le périmètre à leurs facultés. Un administrateur habilité sans affectation conserve le périmètre transversal du système. Le dossier 360° ajoute le registre de l’inscription lorsque le dossier et les documents sont tous deux accessibles.

L’audit académique conserve l’acteur, le motif, la cible et les changements utiles pour le catalogue, les modèles, les demandes et la délivrance. La boîte de notifications reçoit des événements minimaux. Les mesures publiques doivent agréger les résultats sans journaliser inutilement les UUID.
