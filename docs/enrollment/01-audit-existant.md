# Audit réel — phase 05

L’audit suit celui de la phase 04. Baseline avant les extensions annuelles : **276 tests réussis**, 152 074 assertions, preuve `evidence/baseline.txt`.

| Capacité | État initial réel | Classes / tables |
|---|---|---|
| Première inscription | Opérationnelle après validation d’admission | StudentAdmissionService, student_profiles, academic_enrollments |
| Réinscription | Opérationnelle, dépend d’une décision explicite | AcademicProgressionService, academic_progressions |
| Programme et maquette | Opérationnels, versionnés | CurriculumService, curriculum_versions, academic_programs |
| Promotions / groupes | Partiels | AcademicPromotion, Classes ; capacity dans fillable mais absente du schéma |
| Confirmation financière | Opérationnelle | StudentFinanceService, première tranche couverte |
| Droits pédagogiques | Opérationnels | AcademicAccessService, AccessRule, FinancialAdjustment |
| Changement de statut | Partiel, formulaire permissif | AcademicAdministrationController::status |
| Congés / abandon / reprise | Absents comme workflow dédié | Ajout à la machine annuelle |
| Transfert historisé | Absent | Nouveau contexte et registre de décision |
| Périmètre de faculté | Absent sur la gestion annuelle | academic_staff_faculties, policy et middleware ajoutés |
| Clôture | Partielle : fermeture sans précontrôle des inscriptions | CloseAcademicYear / OpenAcademicYear |
| Espace étudiant inscriptions | Partiel, surtout une entrée services | Nouvelle page dédiée MyEnrollments |
| Concurrence à 5 000 utilisateurs | Non vérifiée | Scénario fourni, aucune certification |

Les routes et modèles existants ont été conservés. La phase ne crée aucun second moteur d’admission ou de comptabilité.

## Audit de reprise — prompt identique du 7 novembre 2026

Le nouveau prompt est identique au précédent : les fonctionnalités opérationnelles ont été réutilisées. La baseline de reprise donne **284 tests PHP réussis**, 152 188 assertions, 68,29 s ([preuve](evidence/reprise/baseline.txt)).

| Écart constaté à la reprise | Correction connectée aux données |
|---|---|
| Entrée Inscriptions encore orientée vers services / dossiers candidats | Navigation vers `dashboard.student.enrollments`, page annuelle et demande directe de réinscription |
| Liste annuelle limitée à recherche, année, statut | Lecture dédiée `AcademicEnrollmentReadService`, filtres faculté/programme/niveau/promotion/groupe/statut/année |
| Promotions et dates peu visibles | Promotion et groupe réellement affectés, date de création du contexte, historique des décisions |
| Conflit de groupe invisible si le statut ne change pas | `expected_context` compare une empreinte du contexte sous verrou |
| Décision et demande étudiante indépendantes | Demande liée à la décision, réponse distincte du motif interne, résolution atomique et propriétaire unique `StudentRequestService` |
| Anciens horaires dépendant du groupe courant | `EnrollmentMembershipHistory` et `AcademicAccessService::sessions`, intervalles de groupe/département à la date de séance |
| Réorientation au même niveau bloquée | Contexte réservé unique + versions historiques, migration de compatibilité préparée |
| Capacité contrôlée mais sans action de configuration | Service/route/formulaire de capacité, protection des affectations et périmètre de faculté |

Aucun module Campus n’existe dans le référentiel inspecté ; aucun transfert entre campus fictifs n’a été créé. Les transferts interuniversitaires et les doubles cursus restent hors des règles activées.
