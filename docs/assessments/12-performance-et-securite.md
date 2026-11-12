# Performance, fichiers et recette

Les listes du personnel et de l’étudiant sont paginées. Les participants, copies de groupe et supports sont chargés sur le périmètre de la page. Les index couvrent les états, révisions et relations de participants. Une remise verrouille la configuration en lecture et le dossier en écriture. La clôture et la validation protègent la cohérence du lot par des verrous d’écriture. Le parcours d’audience traite des lots bornés et recalcule l’éligibilité via le service académique.

Les fichiers utilisent les contrôles de stockage privé de la phase 09. Le code restaure la cohérence lors d’un échec détecté de stockage ou de transaction. Un arrêt brutal entre écriture disque et validation SQL peut laisser un fichier à inventorier. Un nettoyage opérationnel exige une comparaison avec toutes les copies, leurs versions et les instantanés historiques avant suppression.

Les notifications utilisent la base Laravel et peuvent passer par les files existantes via `ASSESSMENT_QUEUE_NOTICES`. La résolution de l’audience et la validation des corrections restent synchrones. Mesurer la durée des verrous de clôture et de validation en recette. Les téléchargements de copies sont servis en local privé. Un stockage objet de copies, une analyse antivirus et des chargements segmentés restent à qualifier sur l’infrastructure cible.

| Mode k6 | Cible de scénario |
| --- | --- |
| `assignments` | 500 étudiants consultant les devoirs |
| `submit` | 1 000 remises rapprochées avec rejeu |
| `exams` | 2 500 consultations d’évaluations |
| `mixed` | 5 000 étudiants sur les cours, devoirs et évaluations |
| `corrections` | Corrections concurrentes sur dossiers jetables |
| `copies` | Téléchargements de copies privées |

```sh
k6 run -e TARGET_ENV=staging -e BASE_URL=https://recette.example \
  -e MODE=assignments -e TARGET_VUS=20 \
  -e ACCOUNTS_FILE=/chemin/prive/assessment-sessions.json scripts/load/assessments.js
```

Le fichier de recette contient les cookies et identifiants jetables. Pour une écriture, fournir une session distincte par VU, `ALLOW_WRITES=disposable`, un jeton CSRF et les champs correspondant au scénario. Une remise exige `resource_id`, `academic_id`, `operation_key` et la version attendue. Une correction exige `resource_id`, `record_id` et un objet `correction` avec révision et motif. Le fichier PDF de charge est facultatif. Les valeurs du tableau sont des cibles à mesurer.
