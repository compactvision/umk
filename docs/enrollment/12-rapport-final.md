# Rapport final — gestion des inscriptions, phase 05

La reprise du prompt identique a prolongé la consolidation existante. Elle n’a recréé ni les comptes, ni les étudiants, ni les admissions ou la comptabilité. Baseline de reprise : **284 tests PHP réussis**, 152 188 assertions.

Fonctionnalités conservées : première inscription après admission validée, matricule permanent, profils, décision officielle de poursuite d’études, réinscription idempotente, maquettes versionnées, finances, dérogations et règles pédagogiques.

Fonctionnalités consolidées ou ajoutées :

- Lecture administrative dédiée avec pagination, recherche et filtres année/faculté/programme/niveau/promotion/groupe/statut ; affichage des groupes, promotions et dates réels.
- Page annuelle étudiante reliée au menu Inscriptions, conditions restantes et demande directe de réinscription sur les décisions existantes.
- Transitions motivées, contrôlées sous verrou, avec détection des affectations périmées et rejeu sans double notification.
- Demande étudiante liée à une décision, résolution atomique et réponse publique distincte du motif administratif interne.
- Suspension, congé, abandon, reprise et clôture : services existants conservés et sécurisés.
- Réorientation vers un autre programme, y compris au même niveau : nouvelle inscription, source conservée, aucun déplacement des résultats ou des écritures financières.
- Horaires et présences selon les affectations historisées à la date de séance ; les droits sur les ressources restent courants.
- Configuration auditée de capacité des groupes, protection des effectifs et périmètre de faculté.
- Conditions institutionnelles de confirmation visibles, et registre administratif masqué à un accès financier seul.

Services principaux : `AcademicEnrollmentReadService`, `AcademicEnrollmentService`, `AcademicProgressionService`, `EnrollmentMembershipHistory`, `AcademicAccessService`, `AcademicGroupService`, `StudentRequestService`, `StudentFinanceService` et `AnnualEnrollmentClosure`. Pages : `EnrollmentManagement`, `MyEnrollments`, `Show`, `Renewals` et `Closure`.

La migration de compatibilité 150000 est préparée pour les contextes versionnés ; son application réelle exige la validation du [plan d’impact](02-modele-inscription-annuelle.md). Elle a été exécutée uniquement dans des tests sur bases jetables. Aucun commit, push, déploiement ou migration de base réelle n’a été exécuté.

Limites restantes : doubles cursus et transferts interuniversitaires non activés ; référentiel Campus absent ; affectations historiques sans traces exploitables non reconstituées ; périmètres des anciens modules hors Student/Enrollment à auditer séparément ; provisioning des périmètres d’agents sans nouvelle interface dédiée. La capacité à 5 000 connexions simultanées et les verrous sur PostgreSQL ne sont pas validés par cette intervention. Les scénarios k6 sont préparés pour la recette.

Les résultats finaux et preuves de cette reprise figurent dans `evidence/reprise/`. Les preuves de la première consolidation sont conservées dans `evidence/`.

Validation finale de reprise : **293 tests PHP et 54 tests frontend réussis**, typage TypeScript, ESLint et build de production réussis. Détails et preuves : [validation](11-tests-et-securite.md), [synthèse machine](evidence/reprise/validation.json).
