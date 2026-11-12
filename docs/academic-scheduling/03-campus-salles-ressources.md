# Campus, salles et ressources

Le référentiel `academic_rooms` porte code, nom, campus, bâtiment, type libre, capacité, équipements, contraintes et statut. Campus et bâtiment sont des libellés de localisation dans le référentiel de salles. Ce niveau de détail suffit au workflow actuel de réservation. La salle peut référencer l’établissement actuel.

Les agents globaux habilités gèrent les ressources depuis Salles et disponibilités. Les planificateurs choisissent une salle dans le référentiel, y compris par créneau d’un plan semestriel. Une saisie historique par nom ou code unique peut résoudre la même salle. Si plusieurs salles portent le nom, le code explicite est requis. Deux salles homonymes de sites différents gardent des identifiants distincts. Les libellés antérieurs sont conservés. Un libellé libre inconnu reste utilisable pour la compatibilité, sans contrôle de capacité de salle.

La capacité couvre le nombre d’inscrits du public à la date de séance. Pour un cours obligatoire versionné à venir, elle couvre aussi le public annuel éligible avant la synchronisation des inscriptions pédagogiques. Un changement de capacité à la baisse ou une désactivation exige de traiter les réservations futures. Le contrôle est effectué lors de la planification et de la publication, et ne constitue pas un quota d’inscription.

`academic_resource_blocks` enregistre une salle ou un enseignant, une plage et un motif. Un bloc ne peut couvrir une séance existante. Sa libération est auditée. Le contrôle des réservations et la déclaration d’indisponibilité partagent le verrou du calendrier. Les équipements sont descriptifs et peuvent faire l’objet d’une règle institutionnelle dans une phase ultérieure.
