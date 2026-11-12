# Intégration au parcours académique

Finance produit le relevé, les échéances et les dérogations ; il n'autorise pas directement un cours ou examen. `AcademicAccessService` reste propriétaire de ces droits selon les règles configurées. L'espace de régularisation reste consultable même quand un droit pédagogique est refusé.

`EnrollmentFinancialConfirmation` porte désormais la confirmation d'inscription à partir du fait « première échéance académique couverte ». Il conserve les contrôles historiques d'admission, statut du profil, année et politique d'inscription. Un paiement, une aide ou une affectation met à disposition le fait financier, puis Enrollment décide. Un remboursement ne suspend pas silencieusement une inscription : les droits sont recalculés par Academic Access et une décision administrative éventuelle conserve son propre workflow.

Le portail `StudentPortalController` et `resources/js/pages/dashboard/student/Portal.tsx` affichent obligations, aides actives, solde, crédit, échéancier effectif, paiements paginés et reçus accessibles. Les cents des tarifs indicatifs viennent du backend ; un ancien tarif USD n'est pas présenté comme CDF. Les soldes officiels ne sont pas recalculés dans React.

`StudentDossierService` reprend les prochaines échéances du relevé. `CardEligibility` tient compte des paiements nets des remboursements et des affectations explicites de frais académiques pour son contrôle historique de première tranche. L'éligibilité aux cartes ne repose plus sur une somme brute ignorante des remboursements.

`FinancialOperationNotice` est une notification Laravel en base, privée et idempotente aux transitions réellement nouvelles. Elle indique référence et contexte sans montant détaillé. L'ouverture vérifie que l'inscription appartient à l'utilisateur puis affiche ses transactions. Aucun email externe n'est envoyé par cette notification.

Les tests de parcours existants restent exécutés : admissions, inscriptions annuelles, dossier, demandes de carte et seed de démonstration. Les fixtures qui modifiaient directement un paiement validé ont été remplacées par des transitions ou nouvelles opérations autorisées ; aucun droit étudiant n'a été étendu pour les contourner.
