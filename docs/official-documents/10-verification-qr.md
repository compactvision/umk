# Service de vérification

`GET /verifier/document/{reference}` accepte un UUID. Le QR utilise la valeur de `APP_URL` et exige HTTPS en production. La page publique donne le type, l’établissement, le numéro ou la référence, la date d’émission, l’échéance éventuelle et le statut. Aucun nom, matricule, résultat, montant, lien de téléchargement ou motif ne figure dans la réponse.

| Réponse | Signification |
| --- | --- |
| 200 | Valide, en attente de remise, expiré, révoqué ou remplacé |
| 404 | Référence inconnue ou mal formée |
| 429 | Limite de 30 requêtes par minute |
| 503 | Registre temporairement indisponible |

La réponse est servie sans cache, sans indexation et sans référent. Comparer la référence publique au document présenté. La page confirme le statut du registre. Le contrôle de l’intégrité des octets a lieu lors du téléchargement privé.
