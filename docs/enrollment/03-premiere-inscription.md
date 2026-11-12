# Première inscription

Le propriétaire reste `StudentAdmissionService::activate`, appelé par le processus d’admission existant. Admission validée et pièces acceptées sont exigées. L’activation crée ou réutilise le compte lié, le profil et le matricule permanent ; elle crée une inscription `pending_confirmation`, jamais une réussite académique.

Les nouvelles créations ordinaires exigent une année ouverte, un niveau actif et, lorsqu’un programme figure dans le snapshot de candidature, un programme ouvert et compatible avec le niveau. Une activation déjà réalisée retourne le contexte existant, même si l’année a ensuite été clôturée.

Le seeder de démonstration utilisait volontairement un catalogue inactif. Il passe désormais explicitement `historicalImport: true`, réservé au service interne avec acteur administratif, pour conserver ce scénario sans ouvrir les formations de démonstration au public. Aucun endpoint HTTP ne permet ce paramètre.

L’inscription est confirmée selon la politique financière préexistante, ou après contrôle administratif configuré. Les documents et l’identité proviennent de la candidature et du profil existants. Les demandes de correction annuelles passent par les demandes administratives existantes et le statut `correction_required`.
