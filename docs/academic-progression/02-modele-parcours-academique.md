# Modèle du parcours académique

L’identité permanente reste dans `StudentProfile`. Les inscriptions, les maquettes et les admissions composent le parcours. Une décision de progression conserve une inscription source et une éventuelle inscription cible. Les cas de parcours portent une référence, une révision, la proposition, la décision et son contexte. Une reprise liée à une offre conserve l’inscription pédagogique et l’EC source.

```mermaid
erDiagram
    STUDENT_PROFILE ||--o{ ACADEMIC_ENROLLMENT : holds
    CURRICULUM_VERSION o|--o{ ACADEMIC_ENROLLMENT : binds
    ACADEMIC_ENROLLMENT ||--o| ACADEMIC_PROGRESSION : starts
    ACADEMIC_PROGRESSION o|--o| ACADEMIC_ENROLLMENT : prepares
    ACADEMIC_ENROLLMENT ||--o{ ACADEMIC_LIFECYCLE_CASE : concerns
    ACADEMIC_OFFICIAL_RESULT o|--o{ ACADEMIC_LIFECYCLE_CASE : certifies
    ACADEMIC_OFFICIAL_RESULT o|--o{ ACADEMIC_PROGRESSION : justifies
    ACADEMIC_PROGRESSION ||--o{ ACADEMIC_RETAKE_ASSIGNMENT : plans
    CURRICULUM_ITEM ||--o{ ACADEMIC_RETAKE_ASSIGNMENT : sources
    COURSE_REGISTRATION ||--o| ACADEMIC_RETAKE_ASSIGNMENT : follows
```

Les colonnes ajoutées aux décisions historiques sont facultatives. La migration ajoute les deux tables sans réécrire les dossiers précédents.
