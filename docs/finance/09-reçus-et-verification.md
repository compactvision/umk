# Reçus et vérification

Le reçu HTML imprimable existant est conservé : `resources/views/student/receipt.blade.php`. `FinanceReceiptService::capture` fige à la confirmation identité, matricule, formation, année, institution, montant, devise, mode, date et valideur dans `receipt_snapshot`. Les modifications ultérieures du profil ne réécrivent pas le reçu. Les reçus historiques sans instantané conservent une présentation de compatibilité ; leur ancienne identité ne peut être reconstruite avec certitude.

L'étudiant accède uniquement à son reçu par UUID sous `/dashboard/student/payments/{uuid}/receipt`. L'agent utilise `/dashboard/admin/finance/payments/{id}/receipt` avec contrôle du périmètre. Aucun paiement pending ne produit un reçu payé. Les réponses sont privées et non stockables.

Le lien signé `GET /finance/receipts/{payment:uuid}/verify`, limité en fréquence, retourne uniquement identifiant opaque, état `valid`, `partially_refunded` ou `invalid`, et date d'émission. Sans signature valide : 403. Ni montant, nom, matricule, email ni solde public. L'invalidation et les remboursements sont calculés à la consultation ; le lien ne certifie pas une absence de remboursement futur.

Un reçu annulé ou totalement remboursé porte une invalidation ; les remboursements partiels exécutés sont signalés séparément du montant initial figé. L'impression navigateur peut servir de PDF utilisateur. Aucun générateur PDF officiel, signature électronique légale, numéro fiscal ou QR code institutionnel n'est introduit sans décision de format ; le lien vérifiable répond au besoin technique actuel.
