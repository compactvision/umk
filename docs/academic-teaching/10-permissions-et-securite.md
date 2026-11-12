# Permissions et sécurité

| Acteur | Consulter | Modifier |
|---|---|---|
| Étudiant | Son contexte, ses offres accessibles et ses travaux privés | Déposer via ses droits existants, aucune mutation officielle |
| Admin `publish academic content` | Offres de ses facultés et activités autorisées | Catalogue, maquette, offre, équipe et publication dans son périmètre |
| Admin `manage academic access` | Offres et roster dans ses facultés | Inscription, synchronisation, retrait, dérogation motivée |
| Admin global `manage users` | Lien du compte enseignant | Rattachement à un compte vérifié avec rôle enseignant |
| Enseignant responsable/intervenant actif | Ses offres, séances, supports communs ; roster avec `manage students` | Lien commun avec `manage courses` et année ouverte |
| Assistant actif | Ses offres, séances et supports communs | Aucune publication ni accès au roster nominatif |
| Tiers | Aucun contexte privé | Aucun |

Les routes passent par authentification et email vérifié. Les services contrôlent la permission et la faculté, même en appel direct depuis l’ancien back-office. Un enseignant doit être lié explicitement et être actuellement affecté à l’offre. Les listes privées ne sont pas exposées dans les références du catalogue. Les fichiers restent protégés par les routes et le disque privé. L’interface ne remplace aucun contrôle Laravel.

Écritures auditées avec acteur, ressource, motif et contexte pertinent. Unicités sur création d’offre, affectation active, participation active et compte enseignant. Les modèles protègent les historiques des mises à jour structurelles/suppressions ; les accès DB privilégiés restent à gérer par la politique d’exploitation. Les réponses hors périmètre sont 403 ou 404 selon la route ; un conflit métier est une erreur de validation sans mutation partielle.

Les rôles d’assistants n’accordent pas implicitement des capacités d’enseignant. Les anciens profils non rattachés à un compte restent non connectés, même si leur email correspond.
