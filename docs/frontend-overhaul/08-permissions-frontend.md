# Permissions des parcours frontend

Les routes enseignant requièrent une session vérifiée et le rôle `professor`. Les services d’enseignement, de contenus et d’évaluation contrôlent les affectations et actions autorisées. La navigation des campagnes exige `manage academic access`. Celle des supports administratifs exige `publish academic content`. Ces deux destinations sont dans des groupes de routes administratifs.

La matrice recense les middlewares et les contrôles directs détectés dans les actions Laravel. La revue détaillée des policies, des Form Requests, des contrôles délégués aux services et des périmètres par faculté reste à mener pour les parcours non vérifiés. Les permissions serveur sont conservées.

La navigation administrative respecte les droits de l’onglet et les périmètres institutionnels. Le serveur refuse les accès directs aux onglets non autorisés. Les évaluations de l’espace enseignant nécessitent une fiche active et le droit de gestion des cours. Le menu étudiant utilise les décisions de consultation du contexte académique.

L’accès administratif à une version de dépôt réutilise les contrôles du téléchargement. L’utilisateur doit avoir le rôle administrateur, la permission de publication et accès aux facultés de l’inscription et de l’offre. Le chemin de stockage de la pièce ne fait pas partie des props Inertia.
