# Intégration Finance

Aucun second solde, paiement ou report de dette n’est stocké dans Enrollment. `StudentFinanceService` reste propriétaire des obligations, versements, confirmations, remboursements, bourses, exonérations et plans. Les reçus restent accessibles indépendamment de la dette via les règles essentielles existantes.

Le fonctionnement initial est conservé par défaut : la couverture de la première tranche confirme automatiquement une inscription `pending_confirmation`, lorsque le profil et l’admission sont actifs et l’année ouverte. Les états `under_review` et `correction_required` exigent le retour explicite au processus de validation.

Deux paramètres institutionnels permettent de séparer contrôle administratif et paiement, sans changer les écritures :

- `STUDENT_ENROLLMENT_AUTO_CONFIRMATION` (défaut true).
- `STUDENT_ENROLLMENT_REQUIRES_FIRST_INSTALLMENT` (défaut true).

Si la première tranche n’est plus une condition de confirmation, la confirmation automatique par paiement est désactivée et la décision reste administrative. Les permissions d’accès aux supports/devoirs/examens restent calculées par `AcademicAccessService` et ses règles financières, exemptions, bourses, échéanciers et dérogations existantes.

Un transfert conserve les écritures sur la source. Aucun doublon de dette n’est créé par le transfert. Les nouvelles obligations sont établies par la comptabilité selon le dossier cible.

Les conditions institutionnelles effectivement configurées sont visibles sur la page administrative. Les nouveaux formulaires et décisions ne modifient ni les paramètres de paiement ni les écritures historiques. Les tests de réorientation au même niveau vérifient aussi le maintien des paiements et résultats sur la source, et l’absence de nouvelle dette automatique sur la cible.
