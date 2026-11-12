# Intégration aux maquettes versionnées

`CurriculumService` reste le propriétaire du workflow : brouillon, revue par niveau, validation, publication, remplacement explicite, archivage. Les maquettes annuelles/cohortes et le champ `academic_enrollments.curriculum_version_id` sont réutilisés. Une nouvelle version peut reprendre les UE/EC via copie et modifier son brouillon. Aucune inscription existante n’est réattribuée lors d’un remplacement.

Le lien versionné d’une offre passe par `curriculum_item_id` : matière, UE, version et programme sont dérivés. Le niveau vient de l’UE, les crédits/coefficient/horaires de l’instantané EC. `AcademicAccessService` exige l’EC de la version de l’étudiant, même lorsqu’une autre version reprend le même identifiant catalogue. Les anciens contextes conservent leurs références.

La préparation d’horaires depuis une maquette en brouillon conserve le mécanisme historique et ne republie pas les offres versionnées d’une autre maquette. La publication de ces dernières passe par leur workflow. L’éditeur de Structure universitaire reste accessible depuis Enseignements. Les mutations de version et rattachements contrôlent le périmètre facultaire, et la génération institutionnelle reste réservée aux agents globaux.

Un redoublement ou une réorientation réutilise le contexte annuel et la version décidés par Enrollment ; une reprise sur une offre compatible est une décision pédagogique motivée. Aucun moteur d’équivalence ou transfert automatique de crédits n’est créé.
