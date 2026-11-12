# Autorisations et périmètres

| Opération | Permission / contrôle |
|---|---|
| Lire annuaires et contextes | admin + une permission académique existante |
| Lire ses propres inscriptions | rôle student + profil lié, requête limitée au profil connecté |
| Transition, groupe, département | admin + manage academic access + périmètre |
| Transfert de programme / faculté | précédent + publish academic content + périmètre destination |
| Décision de progression | admin + publish academic content + périmètre source |
| Configurer la capacité d’un groupe | admin + manage academic access + périmètre de la faculté du groupe |
| Finance | manage academic finance, indépendamment des décisions administratives |
| Compte numérique | manage academic access + manage users |
| Précontrôle / clôture annuelle | manage academic access + administrateur de périmètre global |
| Réouverture exceptionnelle | précédent + configure settings + motif explicite |

`academic_staff_faculties` est un périmètre optionnel : sans affectation, les administrateurs historiques restent globaux ; une fois des facultés affectées, `AcademicEnrollmentPolicy`, `AcademicStaffScope` et `EnsureAcademicStaffScope` limitent listes, dossiers, documents et opérations annuelles. Les relations paiements, ajustements, demandes et soumissions sont résolues avant autorisation. L’affectation des agents se provisionne par l’administration des données ; aucun nouveau rôle n’est recréé et aucune interface fictive de gestion des agents n’est ajoutée.

Ce périmètre est introduit pour la gestion Student/Enrollment. Une généralisation exhaustive aux anciens modules de catalogue, admission et cartes nécessitera un audit transversal distinct ; les aperçus de justificatifs liés au dossier ont déjà reçu un contrôle supplémentaire. Le modèle n’est pas une architecture multi-tenant.

Le frontend reflète les permissions ; les policies, middleware et services décident côté serveur. Les règles pédagogiques viennent exclusivement de `AcademicAccessService`.

La liste annuelle utilise `AcademicEnrollmentReadService` pour les recherches et les filtres, toujours à l’intérieur du périmètre de l’agent. Les listes de facultés, programmes, niveaux et promotions proposées comme filtres sont également limitées. Un accès financier seul ne reçoit ni les motifs internes du registre de décisions ni les demandes à examiner. Le lien de clôture n’est proposé qu’aux agents globaux habilités ; le contrôle serveur reste obligatoire.
