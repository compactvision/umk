# Maquettes versionnées

Une version appartient à un programme et cible exactement une année ou une cohorte. Chaque unité appartient à un niveau du programme et à une période configurée. Chaque matière référence un cours existant et conserve son libellé, code, description, contenu, crédits, coefficient et heures CMI/TD/TP. Les libellés du programme, du cycle, du niveau et de la période font partie de la référence historique.

| État | Action possible |
|---|---|
| Brouillon | Modifier les unités et matières, valider ou archiver |
| Validée | Publier, rouvrir en brouillon ou archiver |
| Publiée | Cloner ; la remplacer explicitement ou l'archiver |
| Remplacée | Consulter, cloner ou archiver |
| Archivée | Consulter ou cloner |

Les décisions exigent un motif et sont journalisées. Révision optimiste et verrou programme évitent les écrasements et les publications concurrentes. Une clé unique empêche deux publications pour le même programme et contexte. Le remplacement n'écrit sur aucune inscription. Une version utilisée reste lisible même archivée. Une archive qui n'a jamais été publiée ne peut être attribuée.

L'attribution manuelle vérifie le niveau, l'année ou la cohorte, la promotion éventuelle et l'absence de version précédente. Une demande identique est idempotente. Une correction de cursus après attribution requiert un futur workflow distinct et audité ; une édition directe d'une ancienne maquette n'est pas prévue. Pour les notes et résultats, référencer les IDs d'inscription, de version, d'unité et de matière, puis ajouter des décisions explicites d'équivalence, de reprise et de reconnaissance des crédits. La phase ne calcule aucune note.
