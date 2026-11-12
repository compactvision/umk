# Recette par rôle

| Acteur | Scénario à dérouler en recette | Preuve locale disponible |
| --- | --- | --- |
| Candidat | Candidater, corriger une pièce, recevoir la décision, activer le dossier | Tests Admissions et Enrollment. |
| Étudiant | Se connecter, voir les cours, l’horaire, les frais, les notes, déposer un devoir, demander un document | Smoke HTTP de navigation et CSRF. Tests métier pour les écritures et l’accès privé. |
| Enseignant | Accéder à ses offres, publier un support, prendre la présence et transmettre la correction | Tests Teaching, planning, contenu et évaluations. |
| Scolarité | Valider une admission, consulter le dossier, traiter réinscription et transfert | Tests Enrollment, progression et concurrence des décisions. |
| Finance | Appliquer un barème, confirmer un versement, annuler ou rembourser, contrôler les reçus | Tests Finance et concurrence sur PostgreSQL. |
| Académique | Publier une maquette, organiser le jury, publier les résultats et préparer la progression | Tests Structure, Results et Progression. |
| Documents | Générer une carte, approuver une attestation, vérifier puis révoquer la référence | Tests Documents et cartes. |

Pour chaque scénario, consigner acteur, version, données synthétiques, résultat attendu, résultat observé, preuve et anomalies. Une recette conjointe par les services reste à conduire. Le contrôle navigateur local couvre les libellés, le premier déplacement de focus au clavier et la largeur de la connexion, de l’inscription et du profil. Les formulaires à erreurs, tableaux et téléchargements restent à contrôler en recette.
