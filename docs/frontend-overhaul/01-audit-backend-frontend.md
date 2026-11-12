# Audit initial du dépôt UMK

L’audit porte sur l’arbre de travail de `main`, au-dessus de `27a95e13`. Le relevé Git initial comptait 834 entrées modifiées, supprimées ou non suivies, y compris des implémentations métier et des artefacts Vite. La baseline utilise les dépendances locales et SQLite en mémoire. La compilation écrit dans un répertoire temporaire.

La matrice 02 inventorie 334 routes enregistrées. 67 actions rendent directement une page Inertia dont le nom est littéral. La présence du fichier React ne valide ni le parcours ni les règles d’accès. Les références et autorisations indirectes restent à confirmer par module.

## Écarts confirmés statiquement

- La route publique `/test` référence `dashboard/faculty/test`, absent du résolveur Inertia.
- La suppression des détails de niveau pointe vers une méthode `destroy` absente.
- Les routes blog `create`, `edit` et `destroy` ciblent des méthodes absentes. La page de détail du blog référence la route de suppression.
- La route administrative d’historique de soumission cible une méthode `submissionVersion` absente. L’action homonyme du portail étudiant doit être évaluée selon son propre périmètre.
- Le tableau de bord plafonne globalement son conteneur à `max-w-7xl`. Les vues spécialisées du portail étudiant remplacent déjà cette limite sur grand écran.
- À 768 px, JavaScript considère encore la sidebar comme mobile alors que les classes Tailwind `md:` appliquent le layout de bureau.
