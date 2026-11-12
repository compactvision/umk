# Permissions

Les routes requièrent une session authentifiée, un compte vérifié et le rôle `admin`. La policy réutilise deux permissions existantes ; aucun nouveau rôle n'est créé.

| Action | Permission |
|---|---|
| Voir la structure et les maquettes | L'une des deux permissions |
| Configurer le référentiel, voir et rattacher des inscriptions | `manage academic access` |
| Créer, modifier, valider, publier ou archiver une maquette | `publish academic content` |

La vérification est effectuée côté serveur, y compris dans les services de mutation. Les IDs de programmes, versions, niveaux, années, cohortes et groupes sont vérifiés selon leur relation avec le contexte. Les listes nominatives et leur recherche sont réservées aux gestionnaires. Les étudiants utilisent les routes du portail protégées par les contrôles d'inscription, d'accès aux offres et aux ressources. L'audit enregistre acteur, action, référence et motif. L'immutabilité des données est appliquée dans les services et les modèles ; une écriture SQL directe privilégiée reste hors de ces contrôles.
