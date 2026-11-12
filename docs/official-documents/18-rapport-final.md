# Rapport de livraison de la phase 12

Le registre réunit le catalogue par faculté, les versions de modèles, les demandes avec contrôle et approbation, l’émission numérotée, l’archive privée, le QR public et la révocation. Il intègre les cartes recto verso, les duplicatas et rectifications, les archives Results et les vues administratives, étudiantes et 360°. Les documents antérieurs conservent leurs octets et références.

## Périmètre livré

| Lot | Résultat |
| --- | --- |
| Conservé | Justificatifs d’admission, matricules, calcul des résultats, reçus Finance et fichiers officiels historiques |
| Consolidé | Demandes étudiantes, approbations, accès académique et financier, photo et éligibilité des cartes, notifications et audit |
| Ajouté | Registre, catalogue par faculté, modèles numérotés, génération centrale, contrôles d’archive, cycle de délivrance et consultation publique |
| Modèles | `OfficialDocumentType`, `OfficialDocumentTemplate` et `OfficialDocument`. Les demandes, cartes imprimées et archives Results existantes gagnent des liens et états additionnels. |
| Documents | Attestation d’inscription, certificat de scolarité, attestation de réussite, carte et parcours interne de diplôme. Intégration des bulletins, relevés annuels et procès-verbaux existants. |
| Autorisations | Gestion du catalogue, approbation, émission et permission supplémentaire pour les diplômes. Voir la [matrice](16-permissions-audit.md). |

Les [conditions de délivrance](11-attestations-certificats.md) réutilisent le dossier académique, les décisions publiées et les règles financières. Le [plan de mise en service](15-stockage-archivage.md) couvre les dépendances, l’activation progressive et la restauration. Les phases suivantes peuvent réutiliser le registre et le stockage pour tout type dont les règles sont validées.

## Vérifications

| Contrôle | Résultat |
| --- | --- |
| PHP avant intervention | 351 réussis, 153 533 assertions |
| PHP après intervention | 355 réussis, 153 670 assertions. [Journal complet](evidence/final.txt) |
| Tests spécifiques | Attestation, correction, approbation, refus d’accès, reprise, archive altérée, duplicata, révocation, éligibilité Results, carte, paiement, remise, remplacement, expiration et panne de stockage. [Quatre scénarios ciblés](evidence/document-workflow.txt) |
| Interface | 59 tests frontend, contrôle TypeScript, ESLint et compilation Vite |
| PDF | Une attestation A4, une carte de deux pages au format configuré, inspection visuelle et décodage des deux QR rendus |
| Déploiement | Migration exercée dans les tests SQLite. Aucun déploiement ni changement sur une base métier. |

Les journaux [baseline](evidence/baseline.txt) et [contrôle PDF](evidence/pdf.txt) utilisent des données synthétiques. Les tests existants des admissions, de Finance, de l’impression historique et de Results font partie de la suite de non-régression.

## Points à valider en recette

- Approbation des modèles et attribution des habilitations par l’établissement. L’activation se fait par faculté.
- Politique de diplôme, valeur du résultat certifié de fin de cursus, durée des cartes, frais éventuels et règles de conservation. Les frais restent gérés dans Finance.
- Mise en place éventuelle d’une signature électronique cryptographique. Le présent mécanisme consigne l’approbation et peut afficher une marque visuelle.
- Migration, concurrence, charge et matériel d’impression en recette. Les scénarios k6 sont préparés. Aucun débit cible n’est revendiqué.
