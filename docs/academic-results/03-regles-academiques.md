# Règlements académiques

Une version est définie pour une maquette publiée, son année, son niveau et un code de session. Elle porte une référence et une date d’application. Son auteur et son approbateur sont distincts. Aucun barème réglementaire n’est préchargé.

| Champ | Format ou décision à fournir |
| --- | --- |
| `scale`, `ec_pass`, `ue_pass`, `eliminatory_below` | Échelle et seuils en centièmes, par exemple `2000` pour 20. Le seuil éliminatoire est facultatif. |
| `precision`, `rounding` | De zéro à deux décimales, puis `half_up`, `half_even` ou `down`. |
| `weighting` | `uniform`, `credits` ou `coefficients`, compatible avec la maquette. |
| `items` | Identifiants d’EC associés aux identifiants d’évaluation et à leurs poids. Un EC calculé totalise 10 000 points de base. |
| `compensation`, `compensation_floor`, `period_pass` | `none`, `unit` ou `period`. Les modes de compensation exigent un plancher. La compensation de période exige son seuil. |
| `credit_label`, `allow_equivalence` | Unité de crédit affichée et autorisation des équivalences référencées. |
| `base_rule_id`, `resit_policy`, `resit_eligibility`, `missing_resit` | Règlement ordinaire, politique de sélection, admissibilité à la consolidation et traitement d’une note manquante au rattrapage. |
| `quorum`, `appeal_days` | Quorum entre 2 et 25 et délai de recours entre 0 et 365 jours. Zéro ferme le dépôt. |
| `decisions` | Codes avec libellé, autorisation de dossier incomplet ou éliminatoire, crédits minimum éventuels et effet de progression `none`, `same` ou `next`. |

Le contrôle rejette les poids incohérents, les seuils incompatibles, les EC ou sources hors contexte et les déclarations dupliquées. L’université doit fournir les références et décisions réelles avant activation. Les cas hors de ces modes, comme les compensations conditionnelles complexes ou un barème à échelle non nulle, exigent une règle institutionnelle et une extension contrôlée.
