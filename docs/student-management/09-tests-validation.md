# Tests et validation

Baseline phase 04 : 269 succès, 3 échecs ; preuve `evidence/baseline.txt`.

Après consolidation phase 04 : **276 succès**, 152 074 assertions, 66,08 s, y compris les quatre tests de `StudentManagementTest`. La suite de référence figure aussi dans `../enrollment/evidence/baseline.txt`.

`StudentManagementTest` couvre recherche postnom, pagination serveur déclarée, absence de données financières pour la scolarité, résumé sans requêtes de sections lourdes, demandes/chronologie paginées, accès administratif interdit aux étudiants, permission croisée de compte, justification, vérification et absence de secrets.

Les tests existants d’admission, matricule, activation, email, mot de passe, sessions, profil, photo privée, finance, cours, horaires et cartes restent exécutés dans la suite finale des deux phases. Les assertions de résultats de `AcademicStructureTest` ont été conservées et pointent désormais explicitement l’onglet Académique.

Résultats combinés et preuves finales : `../enrollment/11-tests-et-securite.md` et `../enrollment/evidence/`.
