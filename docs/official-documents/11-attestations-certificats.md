# Attestations et certificats

L’attestation d’inscription part de l’admission validée, du profil actif ou diplômé et d’une inscription confirmée ou terminée. Le certificat de scolarité exige une inscription courante et une année ouverte. L’attestation de réussite se fonde sur une décision publiée et un seuil de crédits configuré en centièmes. Aucun résultat provisoire ne permet une émission.

## Contrat Finance

`AcademicAccessService::decision(entry, documents_request)` résout les règles de l’année et du niveau, la situation financière et les dérogations. Le portail exige cette permission de délivrance pour toute nouvelle demande. Les types soumis à condition financière la réévaluent au contrôle, à l’émission et au téléchargement. La carte applique également le contrôle Finance existant de première tranche via `CardEligibility`.

Les frais éventuels sont saisis et confirmés dans Finance, selon la réglementation locale. Aucun tarif ni imputation automatique n’est activé par cette phase. La règle documentaire peut vérifier un type d’obligation configuré et ses exonérations via le moteur d’accès existant.
