# Rapprochement bancaire explicite

`FinanceReconciliationService` lit un CSV UTF-8 avec en-tête exact :

```csv
bank_reference,payment_reference,amount,currency,date
OP-BANQUE,REFERENCE-PAIEMENT,125.50,USD,2026-11-07
```

Pas de séparateur décimal virgule ni conversion de devise. Fichier HTTP limité à 2 Mio, import à 500 lignes ; dates ISO, montants exacts, références de 180 caractères maximum. Les lignes vides sont ignorées. Format invalide : aucune écriture.

La prévisualisation classe `match`, `mismatch`, `duplicate`, `unmatched`. Correspondance exacte : référence interne, montant, devise et paiement pending/confirmed, dans le périmètre autorisé. Les détails d'autres facultés ne sont pas retournés comme correspondance. Un doublon de référence bancaire dans le fichier n'est pas sélectionnable.

Routes POST `/dashboard/admin/finance/reconciliation/preview` puis `/commit`. Le dépôt seul ne confirme rien. La prévisualisation est conservée dans la session de l'agent pendant 30 minutes. Le commit exige indices distincts explicitement sélectionnés et justification ; il recharge et revalide les écritures avant confirmation/rapprochement dans une transaction. La session est consommée après succès.

Une ligne persistée a une unicité `(account, bank_reference)` ; montant, devise, paiement et date identiques rendent le rejeu sans effet. Une divergence est refusée. Aucune ressemblance ne permet de changer le montant confirmé. Un écart exige une investigation puis une opération métier distincte. Une erreur annule tout le lot validé.

Il n'y a ni connecteur bancaire automatique, ni rapprochement approximatif, ni planification d'import. Les courses SQL rares entre transactions de comptes différents restent arbitrées par la contrainte unique et un rollback ; l'agent peut recharger la prévisualisation. Vérifier les verrous et erreurs du moteur SQL de production avant montée en charge.
