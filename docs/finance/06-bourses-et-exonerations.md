# Bourses, réductions et exonérations

Décisions existantes consolidées dans `StudentFinanceService::adjust` : `scholarship`, `reduction`, `exemption`, `plan`, et les dérogations d'accès existantes. Périmètre : inscription annuelle et type de frais, avec dates de début/fin facultatives, auteur, justification et activation/révocation conservées.

Une bourse institutionnelle ou réduction diminue les frais dus. Une bourse de tiers est une promesse de financement : elle reste visible mais ne diminue ni la dette ni ne fabrique un paiement. Le règlement réel du tiers est un versement confirmé, affecté selon les mêmes règles que les autres.

Montant fixe et pourcentage sont exclusifs. Les pourcentages de 0 à 100 sont parsés en points de base, puis appliqués au montant brut en calcul entier ; le montant est figé à l'octroi. Exemple : 50 % de 1,01 donne 0,51. Exonération : couverture totale de la catégorie ; elle ne se cumule pas avec une autre remise institutionnelle active incompatible. Le cumul de bourses/réductions nécessite une autorisation explicite des décisions concernées et reste plafonné aux frais nets disponibles.

`operation_key` avec empreinte de la demande rend un rejeu exact sans effet supplémentaire et refuse une réutilisation divergente. Les décisions anciennes sans clé sont conservées ; leur cumul historique n'est pas modifié automatiquement. Les critères institutionnels d'attribution ne sont pas inventés : l'agent habilité atteste la décision par son motif ; un moteur de sélection automatique de boursiers n'est pas introduit.

Le panneau « Aides et décisions financières » du back-office affiche source, montant, motif et état, avec révocation justifiée. L'étudiant voit les aides actives ; les détails d'autorité restent dans l'audit administratif.
