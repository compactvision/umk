# Permissions et sécurité

| Acteur | Consulter | Écrire |
|---|---|---|
| Étudiant | Son planning publié, ses présences, ses demandes et pièces | Motiver et compléter sa propre justification |
| Planificateur avec `publish academic content` | Calendrier, historique, appels et rapports de ses facultés | Planifier, valider, publier, reporter, annuler et gérer l’appel |
| Planificateur global | Ressources partagées | Salles, capacités et indisponibilités |
| Agent avec `manage academic access` | Demandes, justificatifs et rapports de son périmètre | Décider et demander une correction |
| Responsable ou intervenant lié | Ses séances et listes autorisées | Appel de sa séance avec `manage students`, avant clôture |
| Assistant lié | Séances des offres affectées | Aucune saisie d’appel dans cette phase |

Les routes gardent l’authentification et la vérification de l’adresse électronique. Les services appliquent le périmètre facultaire et l’affectation, même sur les routes directes. Les listes et l’export utilisent le même périmètre. La sélection d’une salle valide son établissement. Le propriétaire d’un justificatif est contrôlé par son inscription annuelle et son profil. L’export neutralise les titres interprétables comme des formules CSV.

Les horaires étudiants utilisent le contrôle central des offres, des inscriptions pédagogiques et des règles de service. La finance reste une dépendance du service central. Aucun nouveau rôle d’accès financier ou permission de modifier les résultats n’est créé.
