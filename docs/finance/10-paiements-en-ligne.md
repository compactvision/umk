# Paiements en ligne : contrats préparés, service non activé

`config/student.php` conserve un vérificateur de paiement non configuré. Aucun prestataire choisi, SDK installé, secret créé, webhook public ajouté ni checkout actif. Les moyens administratifs disponibles ne constituent pas une intégration numérique opérationnelle.

Dans `app/Modules/Student/Domain/Payments` : `PaymentProviderVerifier::verify` retourne `VerifiedPayment` après validation de signature et vérification serveur ; `PaymentGateway` le complète avec `initiate(PaymentIntent)` et `lookup(reference)`. L'intention décrit référence interne, montant entier, devise, retour et expiration ; `PaymentInitiation` décrit référence prestataire et redirection.

`ProviderPaymentReconciliation` réutilise la confirmation transactionnelle : statut final confirmé, montant/devise exacts, contexte verrouillé, idempotence, reçu et notification. Les refus prestataire et erreurs de montant/devise ne confirment rien. Un retour navigateur n'est jamais une preuve de règlement.

## Décisions et réalisation restantes

1. Choisir prestataire, devises, frais, environnement de test, modes autorisés et comptes bancaires.
2. Implémenter l'adaptateur, signature exacte, contrôle temporel/rejeu des événements et vérification serveur documentée par le prestataire.
3. Persister les intentions et événements externes avec unicités ; distinguer créé, pending, expiré, échec, confirmé et résultat ambigu. Les contrats seuls ne fournissent pas encore ce stockage ni une file d'événements.
4. Créer une route de webhook spécifique avec signature obligatoire, journal minimal, reprise des délais, délais d'attente et consultation `lookup` pour les résultats ambigus ou événements désordonnés.
5. Définir la réconciliation périodique et la politique de remboursement externe. Une future capacité optionnelle de remboursement doit fournir preuve et référence serveur ; le workflow administratif actuel ne l'effectue pas.
6. Tester en sandbox prestataire : signature invalide, répétition, ordre inversé, timeout après débit, montant/devise incohérents, expiration puis règlement tardif, remboursement partiel et total.

Ne pas activer les routes ni configurer le vérificateur avant ces preuves. Les tests locaux de faux vérificateurs valident le contrat applicatif, pas une intégration bancaire réelle.
