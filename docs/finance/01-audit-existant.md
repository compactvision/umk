# Audit du module Finance — 7 novembre 2026

## Périmètre et baseline

Audit du dépôt réel : migrations Student, modèles StudentObligation, StudentPayment et FinancialAdjustment, StudentFinanceService, AcademicAccessService, ProviderPaymentReconciliation, contrôleurs AcademicAdministrationController et StudentPortalController, routes/web.php, portail React, reçus Blade, tests et permissions existantes. Les responsabilités financières restent dans le module Student : aucun déplacement massif ni second module autonome.

Avant cette phase : `php artisan test` a donné **293 tests réussis, 152 393 assertions**, en 68,52 s. Sortie conservée dans [evidence/baseline.txt](evidence/baseline.txt). La base métier n'a pas été réinitialisée. Les tests utilisent SQLite en mémoire.

| Fonction avant intervention | État constaté | Traitement de phase 06 |
|---|---|---|
| Frais LevelDetail par niveau / national / étranger | Opérationnel, sans devise propre ni versions | Conservé comme source historique USD ; instantanés et versions explicites ajoutés |
| Obligations et paiements en cents | Opérationnel | Consolidé, calculs entiers et mutations protégées |
| Montants des anciens DTO LevelDetail | Présentation en float et addition flottante | Addition remplacée par des cents ; DTO de présentation conservé |
| Paiements saisis, confirmés, annulés | Opérationnel | Références rejouables, audit et notification privée |
| Affectation d'un versement à plusieurs frais | Absente | Tables d'affectation et contre-affectation ajoutées |
| Bourse / exonération | Partiel | Pourcentage, financement tiers et cumul contrôlé |
| Échéancier dérogatoire | Enregistré mais retard basé sur dette initiale | Échéancier effectif utilisé par relevé et rapports |
| Remboursement | Simple statut comptable | Demande, autorisation et exécution distinctes |
| Reçu imprimable | Opérationnel, identité vivante | Instantané à confirmation, état actuel et lien signé |
| Rapprochement CSV | Absent | Prévisualisation puis validation explicite |
| Paiement prestataire | Contrat serveur présent, vérificateur non configuré | Contrats étendus ; aucun prestataire activé |
| Dashboard / exports financiers | Vues dispersées, liens incomplets | Vue administrative filtrée et export monétaire |
| Accès académique | Service central opérationnel | Conservé, alimenté par la situation financière consolidée |

## Risques identifiés

Le statut historique `refunded` ne prouvait aucun décaissement. Il est conservé comme contrepassation historique et présenté séparément des remboursements exécutés. Aucun décaissement ancien n'a été fabriqué.

Les modèles permettaient une modification directe des montants, et les barèmes ne conservaient pas leur version de référence. Les nouvelles écritures sont protégées au niveau applicatif ; les anciens enregistrements ne sont pas réécrits. Le SQL direct et un administrateur de base restent hors protection Eloquent : restriction des accès DB et sauvegardes restent nécessaires.

L'absence de devises propres sur LevelDetail interdit une conversion implicite : ce barème de compatibilité ne s'applique qu'à la devise historique configurée. Les sommes USD et CDF restent séparées. Les capacités annoncées de 5 000 connexions n'étaient pas démontrées par un test de charge.

Dépendances conservées : inscription annuelle, profil, programme et niveau, année académique, Gate/Spatie, périmètre facultaire, audit académique et notifications Laravel. Le système assure un suivi opérationnel ; il ne possède pas une comptabilité générale en partie double.
