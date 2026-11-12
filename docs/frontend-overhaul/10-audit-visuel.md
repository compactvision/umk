# Vérification navigateur

Le lot layout a mesuré le conteneur partagé à six largeurs dans quatre configurations. Les 24 mesures Chrome utilisent les styles Vite compilés et un rendu isolé du layout. Les résultats sont détaillés dans le document 05.

Le lot navigation a vérifié neuf interactions Chrome sur des pages Inertia authentifiées générées en environnement de test. Les profils administration, candidature et enseignement ont été testés à 375, 768 et 1 440 px. Les scénarios vérifient l’ouverture du menu, la destination attendue, la fermeture par Échap et la restitution du focus. Les tests HTTP couvrent séparément l’accès aux destinations et les refus liés aux permissions.

## Parcours métier sur Laravel local

Chrome a utilisé les assets Vite compilés, une base SQLite temporaire, des comptes de test et des sessions Laravel. Les actions ont été exécutées dans le navigateur et envoyées au serveur. Les écritures, fichiers et téléchargements sont restés dans l’environnement de test.

| Lot | Écrans et actions vérifiés | Résultat |
|---|---|---|
| Actualités | Liste publique, pagination et recherche administratives, ouverture et fermeture des formulaires par URL, création, édition sur mobile, effacement du résumé, import d’image, légende et texte alternatif après rechargement, retrait de l’image et confirmation de suppression | Réussi, rejoué après le correctif Vite |
| Niveaux | Accès direct à la fiche sur l’onglet Cours, absence d’action d’édition pour une matière archivée, création de cours et relecture, annulation d’un brouillon et enregistrement du plafond de crédits à 375 px | Réussi après correction d’une erreur 500 du chargement Vite |
| Dépôts pédagogiques | Dossier, liste des travaux, deux versions, téléchargement du fichier précédent et comparaison de ses octets, retour aux travaux, version absente et refus étudiant et administrateur hors faculté | Réussi à 375 et 1 440 px |

Le rendu Blade conserve le préchargement de la page lorsqu’elle a une entrée dans le manifeste Vite. Si le bundler fusionne cette entrée, le point d’entrée de l’application charge la page via le résolveur Inertia. Une régression PHP couvre le cas du manifeste sans entrée distincte.

## Validation complémentaire dans Chrome

Les cinq lots ci-dessous ont été exécutés successivement sur Laravel local, avec les assets compilés et une base SQLite dédiée. Les rôles candidat, étudiant, enseignant et administrateur ont utilisé de vraies sessions Laravel. Les versements, documents et fichiers étaient des données de test.

| Lot | Parcours vérifié | Écart corrigé |
|---|---|---|
| Admissions | Campagne ouverte avec justificatif complémentaire, candidature et envoi de pièce sur mobile, suivi du dossier, analyse, acceptation de la pièce, validation et rechargement | Les actions de revue reviennent au dossier concerné même après l’aperçu d’un justificatif |
| Finances | Saisie en attente, confirmation, recalcul du solde, demande et exécution d’un remboursement, export CSV filtré, prévisualisation et confirmation d’un rapprochement, reçu mobile et refus par rôle et faculté | L’export utilise le téléchargement natif et les réponses de fichier préservent la page de retour en session |
| Inscriptions académiques | Confirmation d’un dossier admis avec première tranche couverte, décision historisée, statut visible côté étudiant sur mobile et accès administratif refusé | Aucun écart constaté sur ce parcours |
| Enseignements | Offre affectée à l’enseignant, ajout d’un support privé, invisibilité du brouillon, publication, téléchargement étudiant sur mobile avec comparaison des octets | Aucun écart constaté sur ce parcours |
| Planning | Création, motif invalide, validation, publication, historique et séance visible dans les deux espaces | La soumission du dialogue de transition ne déclenche plus le formulaire d’édition parent |

La couverture Chrome concerne les scénarios décrits dans ce document. Les autres modules et les variantes qui ne figurent pas dans ces tableaux restent hors de cette validation navigateur.
