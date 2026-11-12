# Modèle des notes et résultats

```mermaid
erDiagram
    CURRICULUM_VERSION ||--o{ ACADEMIC_RESULT_RULE : encadre
    ACADEMIC_RESULT_RULE ||--o{ ACADEMIC_DELIBERATION : applique
    ACADEMIC_DELIBERATION o|--o{ ACADEMIC_DELIBERATION : revise
    ACADEMIC_DELIBERATION ||--o{ ACADEMIC_OFFICIAL_RESULT : publie
    ACADEMIC_ENROLLMENT ||--o{ ACADEMIC_OFFICIAL_RESULT : concerne
    ACADEMIC_ASSESSMENT_HANDOFF }o--o{ ACADEMIC_OFFICIAL_RESULT : documente
    ACADEMIC_OFFICIAL_RESULT ||--o{ STUDENT_SERVICE_REQUEST : conteste
    ACADEMIC_DELIBERATION ||--o{ ACADEMIC_RESULT_DOCUMENT : archive
    ACADEMIC_OFFICIAL_RESULT o|--o{ ACADEMIC_RESULT_DOCUMENT : justifie
    ACADEMIC_OFFICIAL_RESULT o|--o{ ACADEMIC_PROGRESSION : fonde
```

Une ligne de résultat par dossier et édition conserve les résultats d’EC, d’UE, de période et d’année dans un instantané. La décision du jury est stockée séparément du calcul. La configuration est approuvée et immuable. Les éditions et documents portent des références stables. Les sources d’évaluation sont référencées dans l’instantané, sans recopier les fichiers des travaux.

La migration ajoute des tables et colonnes, sans conversion automatique des notes manuelles ni suppression de documents historiques. Les prérequis s’appuient sur la dernière édition officielle applicable au dossier et à l’UE. En l’absence d’une édition officielle de ce contexte, les résultats d’UE historiques restent utilisables.
