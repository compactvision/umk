# Architecture documentaire

`App\Modules\Documents` porte le catalogue, les contrôles d’éligibilité, les transitions et l’archivage. Les contrôleurs HTTP et le job appellent les mêmes services. Le portail étudiant réutilise la résolution de l’inscription du portail. Le back-office réutilise les périmètres de faculté.

```mermaid
erDiagram
    UNIVERSITY ||--o{ DOCUMENT_TYPE : configure
    FACULTY ||--o{ DOCUMENT_TYPE : scope
    DOCUMENT_TYPE ||--o{ DOCUMENT_TEMPLATE : versions
    USER ||--o{ DOCUMENT_TEMPLATE : signs
    ACADEMIC_ENROLLMENT ||--o{ SERVICE_REQUEST : submits
    DOCUMENT_TYPE o|--o{ SERVICE_REQUEST : categorizes
    DOCUMENT_TEMPLATE o|--o{ SERVICE_REQUEST : pins
    ACADEMIC_OFFICIAL_RESULT o|--o{ SERVICE_REQUEST : certifies
    SERVICE_REQUEST ||--o| OFFICIAL_DOCUMENT : emits
    DOCUMENT_TEMPLATE ||--o{ OFFICIAL_DOCUMENT : renders
    OFFICIAL_DOCUMENT o|--o{ OFFICIAL_DOCUMENT : precedes
    OFFICIAL_DOCUMENT o|--o{ CARD_ISSUANCE : supersedes
    ACADEMIC_DELIBERATION ||--o{ ACADEMIC_RESULT_DOCUMENT : archives
```

Le registre public interroge les archives de Documents et de Results. Les reçus passent par Finance. Aucune donnée du dossier n’est copiée dans une base publique.
