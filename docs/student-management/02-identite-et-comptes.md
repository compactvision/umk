# Identité permanente et compte

- `users` / `User` : email, mot de passe haché, vérification, rôles, sessions et tokens.
- `student_profiles` / `StudentProfile` : `user_id` unique, `matricule` unique nullable, statut universitaire permanent, `personal_details`, photo privée.
- `academic_enrollments` / `AcademicEnrollment` : contexte annuel, année/niveau/groupe/département, maquette et cohorte.

Le matricule est généré par le parcours de candidature, puis repris par `StudentAdmissionService`. L’activation est idempotente. La réinscription réutilise le profil et le matricule. Un matricule annuel n’est pas une nouvelle identité.

Le profil existant permet la modification personnelle du nom, du postnom et de certaines données officielles ; cette règle préexistante a été conservée et reste auditée par `student_profile_updated`. Les champs `matricule`, programme, maquette, statuts et identifiants propriétaires sont interdits dans `UpdateStudentProfileRequest`. La correction administrative d’identité légale n’a pas reçu un nouveau workflow parallèle : demande via `student_service_requests`, examen par la scolarité, intervention traçable selon la procédure institutionnelle. Un circuit de validation obligatoire des noms reste à définir si l’université souhaite changer la règle actuelle.

Les coordonnées du dossier lisent le même `personal_details` et la même photo que l’espace étudiant. La candidature et son snapshot restent des preuves historiques, non une seconde copie vivante du profil.
