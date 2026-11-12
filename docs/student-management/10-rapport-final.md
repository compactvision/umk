# Rapport phase 04

Conservés : comptes, activation, matricules, profils, admissions, calculs financiers, cours, notes, documents, demandes, audit et cartes existants.

Consolidés : recherche par postnom et matricule permanent, filtres programme/année/statut, contexte récent par étudiant, libellés historiques des programmes, restrictions sur les aperçus et lecture financière séparée.

Ajoutés au dossier : chargement serveur par onglet, pagination des historiques et listes longues, demandes/réclamations, compte et sécurité, état de carte, résumé financier réservé, téléchargement nominatif des documents académiques.

Corrigé : chargement ambigu de la première inscription académique dans l’espace candidat/étudiant, responsable des trois échecs initiaux.

Limites explicites : suspension numérique séparée non implémentée ; les profils légaux restent modifiables selon les règles préexistantes et un circuit institutionnel plus strict nécessite une décision métier ; aucun diplôme ou crédit fictif ; capacité de 5 000 connexions non mesurée. Le périmètre annuel fait l’objet de la phase 05 livrée dans la même intervention.

Aucun commit, push, déploiement, migration de production ou réécriture des données historiques n’a été exécuté. Voir le rapport combiné `../enrollment/12-rapport-final.md`.

Validation combinée initiale (avant reprise de phase 05) : **284 tests PHP et 51 tests frontend réussis** ; TypeScript, ESLint et build réussis. Preuves dans `../enrollment/evidence/`.

La reprise de la phase 05 étend ensuite les contextes versionnés et les horaires historiques ; voir le rapport actuel `../enrollment/12-rapport-final.md`.
