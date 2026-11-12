# Passage au niveau supérieur

```mermaid
flowchart LR
    A[Résultat publié] --> B[Contrôler la règle et le niveau suivant]
    B --> C[Agent habilité publie la destination]
    C --> D[Étudiant lance la réinscription]
    D --> E[Enrollment ouvre un dossier en attente]
    E --> F[Contrôle administratif et confirmation]
```

La destination est le niveau suivant dans l’ordre du programme. Les nouvelles maquettes figent cet ordre dans leur snapshot. Les anciennes utilisent l’ordre disponible du programme. L’année cible doit être ultérieure. La décision conserve l’édition de résultat, la règle et le programme. La réinscription vérifie l’édition actuelle avant création et refuse une maquette cible ambiguë. Un redépôt retourne la cible existante.
