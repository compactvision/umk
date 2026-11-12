# Contrats entre domaines

| Fournisseur | Contrat consommé |
| --- | --- |
| Results | `ResultInputs::latest` retourne la dernière édition publiée de l’inscription. La décision et les UE certifiées viennent du snapshot et de son règlement. |
| Enrollment | `AcademicProgressionService::start` crée une inscription en attente. `AcademicEnrollmentService` confirme, transfère ou enregistre la fin de cursus approuvée. |
| Structure | `CurriculumService::bind` attache une version publiée compatible à la cible. La source conserve sa version. |
| Teaching | `CourseRegistrationService` contrôle l’offre, le groupe et les prérequis pour une reprise liée. |
| Finance | Le démarrage de réinscription conserve l’application du barème par Finance selon la catégorie existante. La confirmation peut contrôler la première tranche. |
| Documents | `GraduationEvidence::approved` fournit la décision de fin de cursus à la vérification documentaire. Documents possède le PDF et la remise. |

Un résultat corrigé suspend une réinscription non consommée jusqu’à une nouvelle décision. Les décisions et cibles consommées demeurent dans l’historique. Le dossier 360° associe les inscriptions, résultats, plans et dossiers du registre.
