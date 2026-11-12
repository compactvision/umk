# Intégration des domaines

| Donnée | Propriétaire | Consommation dans le dossier |
|---|---|---|
| Candidature et justificatifs | Enrollment, EnrollmentDocument, EnrollmentEvent | Décision, fichiers privés, événements |
| Profil et coordonnées | StudentProfile, User | Identité commune avec le portail |
| Années et cursus | AcademicYear, AcademicEnrollment, CurriculumVersion | Contexte et inscriptions paginées |
| Cours et règles | AcademicAccessService | Cours autorisés et publications nominatives |
| Obligations et solde | StudentFinanceService | Lecture uniquement, pas de second solde |
| Demandes | ServiceRequest | Statut, contenu, réponse ; raccourci vers respond |
| Audit | AcademicAudit et EnrollmentEvent | Chronologie administrative filtrée |
| Cartes | CardRequest, CardIssuance, CardEligibility | État et prérequis réels |
| Sessions et vérification | RevokeCredentials, VerifyEmail | Réutilisation des mécanismes Identity |

Aucune duplication du moteur financier, des admissions, des cartes ou de l’authentification. Les nouvelles décisions d’inscription sont détaillées dans la documentation phase 05.
