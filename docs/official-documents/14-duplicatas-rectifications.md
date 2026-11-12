# Duplicatas, rectifications et révocations

Le duplicata conserve le contenu source et l’échéance maximale de la référence antérieure. Sa nouvelle référence et le motif sont historisés. Les cartes passent par un remplacement. La rectification commence par une correction dans le domaine propriétaire si nécessaire. Le gestionnaire dépose ensuite une nouvelle demande. Après approbation, le PDF de remplacement est archivé et l’ancienne référence est marquée remplacée.

```mermaid
flowchart LR
    A[Référence émise] --> B[Agent habilité et motif]
    B --> C[Verrouiller inscription et document]
    C --> D[Révoquer et auditer]
    D --> E[Statut public révoqué]
    D --> F[Octets privés conservés]
    A --> G[Demande de rectification]
    G --> H[Contrôle et nouvelle approbation]
    H --> I[Nouveau PDF archivé]
    I --> J[Référence initiale remplacée]
```

Une révocation ou un remplacement porte sur la référence visée. Lorsque plusieurs duplicatas sont en circulation, le service traite aussi les références concernées.
