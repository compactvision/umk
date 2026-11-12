# Workflow administratif

La page Admissions donne accès aux candidatures nouvelles, en analyse, à corriger, à réexaminer, déjà réexaminées, admises, refusées et historisées. Les filtres combinent recherche, année, faculté, niveau, programme, agent ayant commencé l’analyse, date de soumission et état des pièces. Les dossiers anciens sans date officielle restent visibles dans les listes générales. La date de création ne leur est pas attribuée comme date de soumission.

L’agent habilité ouvre un dossier, démarre l’analyse et examine les pièces. Le dossier conserve l’auteur de la prise en charge, les verdicts par version, les motifs et les résultats d’envoi. La prise en charge identifie l’agent initial, elle ne bloque pas l’intervention d’un autre agent habilité de la même université. Les conflits de décisions sont arbitrés par verrou transactionnel.

Paramètres d’admission ouvre les campagnes par programme, année et niveau. Un agent peut ouvrir ou fermer une campagne, indiquer les dates inclusives en heure de Kinshasa et configurer des justificatifs complémentaires. Les modifications demandent un motif et sont journalisées. Les conditions générales continuent à être configurées dans le niveau.

| Routes actives | Usage |
|---|---|
| `GET /admission` et pages publiques de formation | Consultation publique |
| `GET /dashboard/enrollments`, `/create`, `/{uuid}`, `/{uuid}/edit` | Liste, création, suivi et reprise |
| `GET /dashboard/enrollment/requirements` et `/draft/show` sous `/dashboard/enrollment` | Conditions et brouillon actif |
| `POST /dashboard/enrollments/save-progress`, `/{uuid}/submit`, `/{uuid}/withdraw` | Sauvegarde, soumission, retrait |
| `/dashboard/enrollments/documents/*` | Dépôt, téléchargement, aperçu, remplacement, suppression de brouillon |
| `GET /dashboard/admin/enrollments`, `/{id}` | Files et détail |
| `POST /dashboard/admin/enrollments/{id}/start-analysis`, `/documents/{uuid}/review`, `/request-corrections`, `/validate`, `/reject` | Traitement du dossier |
| `GET/POST /dashboard/admin/enrollments/campaigns` | Consultation et configuration des campagnes |
| `GET /dashboard/student`, `POST /dashboard/admin/student-academic/{id}/status` | Espace étudiant et confirmation annuelle |
