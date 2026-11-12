# Notifications de planification

Les changements utilisent `AcademicScheduleNotice` sur le canal Laravel en base. La publication, le changement de créneau ou de salle, l’annulation et le report préviennent le public concerné. Pour un report, le service considère le public de l’ancien et du nouveau créneau. Les enseignants sont identifiés par leurs affectations et leur compte lié. L’ouverture d’une notification renvoie vers un écran dont les droits sont à nouveau vérifiés.

Le dépôt informe les agents autorisés dans le périmètre. Les décisions et demandes de correction informent l’étudiant. Les raisons confidentielles et pièces restent dans le dossier de justification.

Les relectures d’une transition et les modifications purement techniques ne déclenchent pas de deuxième avis. La configuration `SCHEDULING_QUEUE_NOTICES=true` permet l’envoi par la queue Laravel après validation de la transaction. Par défaut, le canal écrit dans la transaction. Avant l’activation en exploitation, vérifier le worker, les délais et la reprise de jobs. Les tests de cette phase couvrent le canal en base par défaut. Aucun email ni autre canal n’est configuré par ce workflow.
