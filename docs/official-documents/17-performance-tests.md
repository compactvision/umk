# Performance et recette

Les listes principales paginent côté serveur. Des index couvrent la référence, le numéro, l’inscription et le statut. Les listes chargent les relations affichées à l’avance. Les fichiers archivés sont téléchargés sans nouveau rendu, avec contrôle SHA-256. L’émission peut passer en file avec `OFFICIAL_DOCUMENT_QUEUE_ISSUANCE`. Le worker doit partager le disque privé. Une reprise relit la demande et son archive unique.

Le scénario [scripts/load/official-documents.js](../../scripts/load/official-documents.js) prépare six modes pour un environnement de recette. Prévoir une session par compte dans un fichier hors Git. Pour `issue` ou `card`, chaque VU reçoit une demande approuvée et jetable, sa révision, un compte d’émission et son jeton CSRF. Contrôler le débit du worker, le retard de file et la disponibilité de l’archive si la file est active. Le statut HTTP d’une demande mise en file mesure son acceptation.

| Mode | Cible du scénario | Données |
| --- | --- | --- |
| `portal` | 5 000 VU | Sessions et inscriptions variées |
| `issue` | 1 000 VU | 1 000 attestations approuvées et jetables |
| `report` | 50 VU | Références de résultats et inscriptions autorisées |
| `download` | 300 VU | UUID d’archives accessibles |
| `verify` | 20 VU | UUID de vérification et limite par IP |
| `card` | 30 VU | Demandes de cartes approuvées et jetables |

Exemple de lancement en recette.

```sh
k6 run -e TARGET_ENV=staging -e BASE_URL=https://recette.example.test -e MODE=portal -e ACCOUNTS_FILE=accounts.local.json scripts/load/official-documents.js
```

Le scénario a passé le contrôle syntaxique Node. La capacité, les temps de réponse sous charge et les verrous concurrents MySQL restent à mesurer en recette.
