# Publication et versions

```mermaid
stateDiagram-v2
    [*] --> Brouillon
    Brouillon --> Publié : valider et publier
    Publié --> Brouillon : retirer ou créer une édition
    Brouillon --> Archivé : archiver
    Publié --> Archivé : archiver
```

Les formulaires de bibliothèque créent des brouillons. La publication et le retrait exigent un motif. Une ressource publiée reste soumise à l’accessibilité de son offre. L’archivage retire la ressource des écrans étudiant, conserve le fichier et rend l’édition non modifiable. La bibliothèque conserve les archives et ne propose pas de route de suppression. Les points d’entrée historiques de création et de publication restent disponibles avec leur comportement explicite.

```mermaid
flowchart TD
    A[Valider fichier et droits] --> B[Vérifier la révision sous verrou]
    B --> C[Écrire le nouveau fichier privé]
    C --> D[Conserver le premier instantané historique si nécessaire]
    D --> E[Inscrire la nouvelle édition et la passer en brouillon]
    E --> F[Valider la transaction]
    C -->|échec| G[Annuler et retirer le nouvel objet]
    E -->|échec| G
    F --> H[Publier explicitement la nouvelle édition]
```

L’identifiant de requête déduplique les créations et réutilisations. La révision évite l’écrasement d’une édition concurrente. Un rejeu d’une publication déjà appliquée ne répète pas l’envoi. Le téléchargement autorisé en cours utilise le fichier résolu au départ. Les requêtes suivantes vérifient de nouveau le statut.
