# Planification et publication

```mermaid
flowchart LR
    A[Choisir une offre affectée] --> B[Définir catégorie et modalité]
    B --> C[Définir consignes dates barème et tentatives]
    C --> D[Enregistrer le brouillon]
    D --> E{Présentiel}
    E -->|Oui| F[Associer une séance validée et publiée]
    E -->|Non| G[Contrôler la fenêtre de remise]
    F --> H[Publier dans une offre ouverte]
    G --> H
```

```mermaid
stateDiagram-v2
    [*] --> Brouillon
    Brouillon --> Publié : publier
    Publié --> Clôturé : constater la fin
    Brouillon --> Annulé : motiver
    Publié --> Annulé : motiver
    Clôturé --> [*]
    Annulé --> [*]
```

Le créneau nominal et la tolérance de remise doivent rester dans les dates de l’offre, du semestre ou de l’année applicable. Les formulaires affichent les dates à Kinshasa et le serveur persiste les instants en UTC. L’ouverture est dérivée de l’heure serveur. La clôture est explicite après la fin de l’épreuve ou de la tolérance. L’annulation retire la publication et conserve les remises existantes. Les évaluations clôturées conservent leurs corrections.

Les dates, le lieu et la durée d’un examen viennent du planning. La gestion des conflits reste dans ce module. La publication peut notifier l’audience actuelle. Un examen annulé dans le planning doit être traité dans le suivi des évaluations avant toute correction.
