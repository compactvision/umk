# Modèle des évaluations

```mermaid
erDiagram
    ACADEMIC_OFFERING ||--o{ ACADEMIC_RESOURCE : contient
    ACADEMIC_SESSION o|--o{ ACADEMIC_RESOURCE : planifie
    ACADEMIC_RESOURCE ||--o| ACADEMIC_ASSESSMENT : configure
    ACADEMIC_RESOURCE ||--o{ ACADEMIC_SUBMISSION : recueille
    ACADEMIC_SUBMISSION ||--o{ ACADEMIC_SUBMISSION_VERSION : conserve
    ACADEMIC_ASSESSMENT ||--o{ ACADEMIC_ASSESSMENT_GROUP : constitue
    ACADEMIC_ASSESSMENT ||--o{ ACADEMIC_ASSESSMENT_RECORD : evalue
    ACADEMIC_ASSESSMENT_GROUP o|--o{ ACADEMIC_ASSESSMENT_RECORD : rassemble
    ACADEMIC_ENROLLMENT ||--o{ ACADEMIC_ASSESSMENT_RECORD : participe
    ACADEMIC_ASSESSMENT_RECORD ||--o{ ACADEMIC_CORRECTION_REVISION : historise
    ACADEMIC_ASSESSMENT_RECORD ||--o{ ACADEMIC_ASSESSMENT_HANDOFF : transmet
```

L’identifiant de ressource reste le point d’entrée des cours et du portail. L’extension 1–1 décrit la configuration d’une nouvelle activité. La tentative de remise correspond à une version reçue. En présentiel, une ligne de participant conserve la situation issue du constat de présence ou d’une décision motivée.

Les clés étrangères protègent les relations. Les contraintes uniques couvrent la configuration par ressource, le participant par évaluation et inscription, la version et le rejeu par copie et la révision transmise par participant. La migration est additive et ne comporte pas de conversion implicite des devoirs ou résultats.
