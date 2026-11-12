# Réinscription et poursuite d’études

Service conservé : `AcademicProgressionService`. Routes existantes : `POST .../student-academic/{academic}/progression` pour la décision et `POST /dashboard/student/renewals/{progression}` pour la demande étudiante.

Une décision motivée précède la demande. Elle choisit une année ultérieure et un niveau autorisé. Dans un programme configuré, le niveau courant est désormais une destination possible de redoublement ; le niveau suivant provient de l’ordre configuré. Le système n’invente jamais une réussite à partir des dates ou des crédits.

La demande étudiante vérifie la propriété, le profil actif, l’admission validée, l’année ouverte et le niveau actif. Un programme configuré devenu indisponible est refusé. Le profil et la décision sont verrouillés ; `target_enrollment_id` assure l’idempotence. Le nouveau contexte reste en attente de confirmation et conserve l’ancien matricule.

Les frais sont établis par `StudentFinanceService::applyTuitionTariff`, pas par un nouveau solde Enrollment. La maquette de destination est résolue par `CurriculumService` ; aucune nouvelle publication ne remplace une référence historique. Les cas ambigus ou non configurés restent explicitement sans rattachement automatique et apparaissent dans le précontrôle de clôture.

La décision et la demande restent visibles dans l’accueil étudiant et l’historique annuel. Aucun passage automatique n’a été ajouté.

La page `MyEnrollments` lit maintenant les décisions officielles par page d’inscriptions, affiche l’année et le niveau proposés, et permet de déposer directement la demande sur l’endpoint existant. Une cible déjà créée ouvre son contexte au lieu de proposer une deuxième demande. Les conditions administratives restantes, la promotion, le groupe et le nombre de demandes ouvertes proviennent du contexte réel.

La navigation « Administration → Inscriptions » et les cartes d’historique du portail pointent vers cette page annuelle ; les candidatures originales restent accessibles par leurs propres routes.
