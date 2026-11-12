# Audit du planning existant

Audit effectué le 10 novembre 2026 avant modification. La baseline PHP a réussi 321 tests et 152 713 assertions en 50,92 secondes sur SQLite en mémoire. [Sortie de la baseline](evidence/baseline.txt)

| Périmètre | Avant la phase 08 | Point traité |
|---|---|---|
| Calendrier académique | `AcademicYear`, `AcademicSemester`, `AcademicCalendarEvent` | Les congés deviennent des exclusions des générations de séances |
| Catalogue et offres | `Courses`, `AcademicOffering`, EC versionné et équipe historisée de phase 07 | La séance garde l’offre, le contexte annuel et le public |
| Salles | Libellé `academic_sessions.room` normalisé pour les conflits | Référentiel, capacité et indisponibilités |
| Séances | `ScheduleService`, créneaux isolés et plans hebdomadaires ou semestriels | Identifiant de série, rejouement, exclusions et modification future |
| Conflits | Intervalle, salle, équipe, niveau et groupe. Verrou partagé sur la première année | Identité de salle, indisponibilités, capacité et contrôle à la publication |
| Publication | Booléen sur la séance, routes historiques et publication depuis la maquette | Validation explicite, contrôle commun et audit des changements |
| Historique | Certaines séances publiées pouvaient être supprimées par les anciennes routes | Annulation conservée et lien vers la séance de report |
| Présences | Une ligne par séance et inscription annuelle, appel administratif | Appel enseignant contrôlé, clôture, version et trace avant/après |
| Justifications | Statut historique `excused` saisi par un agent | Demande, pièce privée, examen et décision distincte |
| Rapports | Consultation de ses présences et dossier 360° | Indicateurs filtrés et export CSV |
| Notifications | Canal Laravel en base pour admissions, inscriptions et finances | Événements de planning et décisions de justification |
| Charge | Requêtes de semaine et affichage Inertia en place | Index de plage, pagination des appels, historique et rapports |

Les suites `ScheduleModuleTest`, `AcademicStructureTest`, `AcademicTeachingTest`, `StudentAcademicJourneyTest` et `UniversityFinanceTest` établissent le fonctionnement réel des dépendances. Le moteur conserve les parcours Laravel et React existants. Les seeders restent des outils de démonstration. Leurs données ne servent pas de preuve de capacité en production.
