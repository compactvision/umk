# Rapport final — Phase 07

Le monolithe et le référentiel pédagogique existants sont conservés. La phase consolide le catalogue et l’éditeur UE/EC, relie une offre annuelle à son EC publié, historise l’équipe et les inscriptions pédagogiques, et raccorde ces dernières à l’accès étudiant, aux séances, aux présences et aux travaux. Les écrans administratifs et enseignants sont accessibles sous `/dashboard/admin/teaching` et `/dashboard/teacher`.

Les doublons de concepts ont été évités : `Courses` pour la matière, `CurriculumVersion/Unit/Item` pour les règles du parcours, `AcademicOffering` pour l’enseignement organisé, `CourseRegistration` pour la participation. L’ancien accès par niveau/groupe/exception reste une compatibilité explicite pour les offres sans EC. Les résultats et écritures financières ne sont ni réécrits ni recalculés.

## Reprise contrôlée

1. Sauvegarder et vérifier la restauration sur copie ; relever les comptes d’offres, séances, ressources, présences, travaux et résultats.
2. Appliquer la migration additive en recette avec le code correspondant. Les anciens identifiants et relations restent intacts, les champs d’intégration anciens sont nuls.
3. Lancer `php artisan academic:teaching-audit --year=ID --details` sur la copie. Le rapport distingue aucune correspondance, candidat unique à vérifier, plusieurs candidats. Aucune mise à jour n’est effectuée. Examiner groupe/promotion, année, département et version avec les agents.
4. Utiliser les offres versionnées pour les nouveaux contextes validés. Une ancienne offre et ses activités restent sur la voie historique. Une adoption d’offre existante avec conservation des droits doit faire l’objet d’un plan de backfill approuvé et testé ; même un candidat unique ne suffit pas à déterminer le public réel.
5. Faire la recette sur le moteur SQL cible : autorisations, accès privés, changements de groupe, conflits, sauvegarde et concurrence. Déployer uniquement après autorisation.

Le retrait destructif automatique de migration est refusé ; conserver les tables et préparer un retour de code compatible après sauvegarde, avec export des nouveaux historiques si un retrait de schéma est décidé. Aucune migration de la base réelle, réinitialisation, publication en production, commit ou push n’a été effectuée.

## Limites

L’équivalence complète, la validation de crédits, la compensation, les examens, les notes, le jury et les bulletins restent hors phase. Les reprises/dérogations sont des décisions explicites, sans moteur de choix automatique. Aucun quota enseignant n’a été inventé. La recette de concurrence et la mesure des 5 000 connexions restent ouvertes. Voir [tests et performance](11-tests-et-performance.md) et [audit initial](01-audit-existant.md).

## Résultats vérifiés

| Vérification | Résultat |
|---|---|
| Baseline PHP | 310 réussis, 152 531 assertions |
| `php artisan test` après build | **321 réussis, 152 713 assertions**, 47,48 s |
| `npm run test:frontend` | **59 réussis**, aucun échec |
| `npm run types`, `npm run lint:check`, `npm run build` | Codes de sortie 0 |
| `git diff --check` | Aucune erreur d’espacement |

Les preuves sont conservées dans [evidence](evidence/). Les onze nouveaux scénarios PHP et le test frontend de la fiche cours s’ajoutent aux assertions historiques. Exécuter le build avant la suite PHP : le test des en-têtes lit le manifeste Vite, qui est temporairement absent pendant sa reconstruction. Aucun test de charge ni migration réelle n’a été exécuté.
