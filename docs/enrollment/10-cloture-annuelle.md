# Clôture annuelle

Page : `GET /dashboard/admin/student-academic/administration/closure`, `EnrollmentManagementController::closure`. Le service `AnnualEnrollmentClosure::report` utilise des agrégats SQL : total, statuts, situations non résolues, maquettes et groupes manquants.

La clôture est autorisée lorsque les contextes sont terminés (`completed`, `cancelled`, `transferred`, `withdrawn`). Les inscriptions en attente, confirmées non clôturées, suspendues, en congé ou en correction nécessitent une décision préalable. Le service de clôture refait le précontrôle sous verrou, même si la page est périmée. La scolarité clôture les contextes selon ses décisions ; aucune réussite n’est déduite des dates.

`CloseAcademicYear` conserve toutes les données et exige un motif pour une année contenant des inscriptions. Une année déjà fermée est traitée de façon idempotente. Aucune note n’est recalculée et aucune réinscription créée. `academic_year_closed` stocke le rapport et l’auteur.

`OpenAcademicYear` continue à interdire deux années ouvertes. Pour réouvrir une année fermée : acteur administratif global, permission `configure settings`, motif explicite et audit `academic_year_reopened`. L’ouverture normale d’une année brouillon conserve le comportement existant.

Les avertissements de maquette/groupe manquants restent visibles, car les données anciennes peuvent précéder le référentiel versionné. Aucune réécriture de ces références n’est faite pour obtenir artificiellement un rapport « propre ».

Les sources transférées au même niveau restent terminales et historisées ; leurs nouvelles cibles doivent recevoir leur propre décision avant clôture. La réservation de contexte n’est pas un indicateur financier ou une validation de progression.
