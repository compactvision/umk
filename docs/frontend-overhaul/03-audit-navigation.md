# Lot 3 — Navigation

## Administration

La sidebar présente 60 destinations distinctes. Les 18 entrées sans destination ont été retirées. Les doublons et les intitulés qui promettaient un écran différent de leur cible ont été regroupés. Les liens vers les campagnes, les supports pédagogiques, les rapports disponibles et les listes filtrées utilisent les routes Laravel existantes.

Les entrées des salles et de la clôture sont restreintes aux administrateurs autorisés au niveau institutionnel. Les onglets métier du dossier étudiant appliquent le même contrôle en accès direct et dans le menu. Les applications secondaires respectent les permissions de planification, de scolarité et d’admission. Les chemins GET, permissions explicites et six ancres sont couverts par les tests.

## Étudiant, candidat et enseignant

Le menu étudiant propose 20 destinations. Le contexte académique est conservé pour les pages qui le requièrent. Les autorisations de consultation sont distinctes des autorisations de dépôt et de téléchargement. Le menu candidat donne accès au suivi des candidatures. Le menu enseignant ouvre les enseignements, les supports après rattachement à une fiche active, et les évaluations avec le droit de gestion des cours. Les mêmes contrôles restent appliqués par Laravel.

Les commandes sans action du tableau de bord ont été retirées. Sur mobile, la sidebar fermée est exclue du parcours clavier. Échap ferme le sous-menu et rend le focus au bouton d’ouverture. Les classes et feuilles de style existantes sont utilisées.

Le lot est validé par les contrôles HTTP et frontend et par neuf scénarios interactifs Chrome. Les scénarios navigateur utilisent des pages Inertia générées sous trois rôles de test et les assets compilés. Les contrôles HTTP vérifient séparément les destinations et leurs autorisations.
