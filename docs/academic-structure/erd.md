# Relations de données

Les liens en pointillé partent des références nullables. Facultés, sites, niveaux, cours, années, classes et inscriptions existaient avant la phase.

```mermaid
erDiagram
    SITES |o..o| UNIVERSITIES : identite_editoriale
    UNIVERSITIES |o..o{ FACULTIES : rattachement
    UNIVERSITIES |o..o{ ACADEMIC_YEARS : rattachement
    UNIVERSITIES ||--o{ ACADEMIC_CYCLES : configure
    FACULTIES ||--o{ ACADEMIC_DEPARTMENTS : contient
    FACULTIES ||--o{ ACADEMIC_PROGRAMS : porte
    ACADEMIC_DEPARTMENTS |o..o{ ACADEMIC_PROGRAMS : encadre
    ACADEMIC_CYCLES ||--o{ ACADEMIC_PROGRAMS : definit
    ACADEMIC_PROGRAMS ||--o{ ACADEMIC_PROGRAM_LEVELS : ordonne
    LEVELS ||--o{ ACADEMIC_PROGRAM_LEVELS : conserve
    ACADEMIC_PROGRAMS ||--o{ ADMISSION_COHORTS : admet
    ACADEMIC_YEARS ||--o{ ADMISSION_COHORTS : annee_entree
    ACADEMIC_PROGRAMS ||--o{ ACADEMIC_PROMOTIONS : organise
    LEVELS ||--o{ ACADEMIC_PROMOTIONS : niveau
    ACADEMIC_YEARS ||--o{ ACADEMIC_PROMOTIONS : annee
    ACADEMIC_PROMOTIONS |o..o{ CLASSES : organise
    CLASSES |o..o{ ACADEMIC_ENROLLMENTS : affecte
    ACADEMIC_PROGRAMS ||--o{ CURRICULUM_VERSIONS : versionne
    ACADEMIC_YEARS |o..o{ CURRICULUM_VERSIONS : cible_annuelle
    ADMISSION_COHORTS |o..o{ CURRICULUM_VERSIONS : cible_cohorte
    CURRICULUM_VERSIONS ||--o{ CURRICULUM_UNITS : contient
    LEVELS ||--o{ CURRICULUM_UNITS : delimite
    CURRICULUM_UNITS ||--o{ CURRICULUM_ITEMS : contient
    CURRICULUM_VERSIONS ||--o{ CURRICULUM_ITEMS : controle_appartenance
    COURSES ||--o{ CURRICULUM_ITEMS : source
    CURRICULUM_VERSIONS |o..o{ ACADEMIC_ENROLLMENTS : fige_reference
    ADMISSION_COHORTS |o..o{ ACADEMIC_ENROLLMENTS : situe
```

La clé composite (unité, version) sur une matière impose son appartenance à la bonne version. L'unique (version, cours source) interdit les doublons. L'unique de publication protège un contexte annuel ou de cohorte ; la règle exclusive année/cohorte est vérifiée par le service. Les champs de validation et de publication référencent les utilisateurs.
