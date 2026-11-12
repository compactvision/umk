# Rapport de reprise frontend UMK

Le lot navigation et les trois lots métier issus des écarts confirmés ont été corrigés et vérifiés dans l’ordre. Les interfaces réutilisent les pages, les modales et les styles existants.

| Lot | Résultat | Vérification ciblée |
|---|---|---|
| Navigation | 60 destinations administratives distinctes, 20 destinations étudiantes, menus candidat et enseignant reliés aux droits réels | 125 tests PHP. Contrôles HTTP sur cinq profils administratifs. Neuf scénarios Chrome sur mobile, tablette et ordinateur |
| Actualités | Accès direct aux modales, filtres, suppression, galerie et champs facultatifs fonctionnels | 22 tests PHP et 287 assertions après le dernier correctif |
| Niveaux | Accès direct à la fiche complète, respect du périmètre et du statut, protection des dépendances et de l’illustration existante | 32 tests PHP et 770 assertions. Quatre cas frontend dédiés |
| Dépôts pédagogiques | Historique et fichier accessibles depuis le dossier académique, avec le même périmètre que le téléchargement | 64 tests PHP et 1 626 assertions |

La matrice finale recense 332 routes. Les 324 actions de contrôleurs applicatifs ont été résolues. Les 66 actions qui rendent directement un nom de page Inertia littéral pointent vers des composants présents. Les cinq actions initialement manquantes ont été traitées. Quatre ont été raccordées et la route de suppression du seul détail de niveau, sans appelant, a été retirée.

Les mesures Chrome couvrent les menus administrateur, candidat et enseignant, ainsi que les scénarios des trois lots métier détaillés dans le document 10. La matrice identifie les routes dynamiques et les opérations qui nécessitent une vérification manuelle plus détaillée. Le nombre de routes inventoriées représente le périmètre de l’inventaire.

La régression finale passe avec 376 tests PHP, 154 270 assertions et 74 tests frontend. Le typage, le lint, la compilation et le contrôle du diff passent.

La reprise Chrome a vérifié Actualités, Niveaux et Dépôts pédagogiques sur une application Laravel locale avec données isolées. Le défaut de chargement Vite constaté en accès direct à une fiche Niveau est corrigé. La régression mise à jour passe avec 377 tests PHP et 74 tests frontend.

La validation Chrome complémentaire couvre successivement Admissions, Finances, Inscriptions académiques, Enseignements et Planning. Elle a corrigé les retours vers le dossier d’admission, le téléchargement de l’export et la page de retour en session, ainsi que la soumission des dialogues de planning. La régression finale passe avec 378 tests PHP et 75 tests frontend. La couverture navigateur des autres modules reste à compléter.
