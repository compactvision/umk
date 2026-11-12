# Dossier 360°

Routes existantes conservées :

- `GET /dashboard/admin/student-academic` — `dashboard.admin.student-academic.index`.
- `GET /dashboard/admin/student-academic/{academic}` — `.show`.
- `GET .../{academic}/photo` — `.photo`, réponse privée sans cache.
- `GET .../{academic}/documents/{resource}` — `.documents.download`.
- `POST .../{academic}/account` — `.account`, limité à six requêtes par minute.

Contrôleur : `AcademicAdministrationController`. Lecture : `StudentDossierService::details`. Page : `resources/js/pages/dashboard/studentAcademic/Show.tsx`.

Le paramètre `section` sélectionne réellement les requêtes serveur : Résumé, Identité, Admission, Parcours, Académique, Présences, Finances, Documents, Demandes, Historique, Compte et sécurité. Le résumé charge l’identité et le contexte courant ; le solde n’est calculé que pour un utilisateur habilité. Les onglets utilisent des visites Inertia avec progression réseau intégrée. `records_page` pagine les présences, ressources, paiements, demandes et chronologie. `enrollments_page` pagine le parcours annuel par 20.

La chronologie fusionne audits et événements d’admission en SQL avec pagination ordonnée, sans exposer les données JSON techniques. L’identité affiche seulement une liste explicite de champs. Les demandes couvrent les inscriptions autorisées du même profil. Les actes académiques et financiers continuent à utiliser leurs services spécialisés.

Le résumé Carte affiche les prérequis d’identité/photo/matricule et les véritables états de demande/impression/retrait. Il ne prétend pas certifier l’éligibilité complète : `CardEligibility` reste son propriétaire.
