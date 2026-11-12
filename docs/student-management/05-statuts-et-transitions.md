# Statuts distincts

| Dimension | Source réelle | Signification |
|---|---|---|
| Compte numérique | User, email_verified_at, sessions | Compte lié et email vérifié ou à vérifier |
| Profil permanent | student_profiles.student_status | active, suspended, graduated, archived |
| Inscription annuelle | academic_enrollments.enrollment_status | État du contexte annuel, machine explicite en phase 05 |
| Finance | StudentFinanceService::balance | unassessed, unpaid, partial, overdue, cleared, exempted |
| Accès pédagogique | AcademicAccessService::decision | Décision calculée par fonctionnalité |

Un profil suspendu ne signifie pas que le compte utilisateur est désactivé. Le dossier l’indique explicitement. Le modèle actuel ne permet pas de déclarer honnêtement un compte « désactivé » : aucune équivalence artificielle n’a été créée.

Voir `../enrollment/05-machine-a-etats.md` pour les transitions annuelles. Les historiques terminaux sont protégés contre les changements administratifs ordinaires.
