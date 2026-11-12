# Détection des conflits

Deux intervalles se chevauchent si le premier commence avant la fin du second et finit après son début. Les bornes adjacentes restent réservables. Les contrôles portent sur les salles enregistrées, les libellés hérités compatibles, les enseignants et assistants en vigueur au créneau, ainsi que le public de l’offre. Le contrôle historique des groupes est conservateur pour les enseignements optionnels. Aucun droit de déroger à une double réservation n’est ajouté.

Une réservation inactive par annulation libère les ressources. La génération depuis les maquettes réutilise les mêmes tests de disponibilité, d’équipe, de salle et de public. La validation et la publication relisent les contraintes. Les indisponibilités d’enseignants sont également contrôlées lors de leur affectation à une offre déjà planifiée.

Les écritures du planificateur, des ressources et des affectations partagent le verrou de calendrier déjà en place. Le report marque la source annulée et crée le remplacement dans la même transaction. Les clés SQL d’occurrence et de remplacement protègent l’unicité. Les opérations directes sur la base et les scripts historiques doivent respecter le même protocole.

Une exclusion temporelle PostgreSQL pourrait renforcer la réservation d’une salle structurée après contrôle des collisions historiques. Le mélange de libellés, de relations et d’états historiques exige une étude et des tests PostgreSQL dédiés. Aucun changement SQL spécifique à ce moteur n’a été appliqué.
