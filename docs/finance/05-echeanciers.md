# Échéanciers, retards et moratoires

`FinancialAdjustment` de type `plan` conserve un échéancier autorisé et son motif. Il ne supprime ni obligations ni versements. Le service exige de 1 à 24 lignes positives, dates valides, somme exactement égale aux frais nets du type concerné. Les paiements déjà confirmés couvrent les premières échéances du plan.

Un nouveau plan révoque les précédents plans actifs de ce type dans la même transaction, avec audit. L'historique reste consultable. Le dernier plan actif et applicable remplace les dates exigibles pour le calcul du retard. Une échéance du jour n'est pas en retard : il faut une date strictement antérieure au jour de Kinshasa.

Une aide qui changerait les frais nets d'un plan existant est refusée : révoquer le plan, décider l'aide puis réaménager sur le nouveau total. Même protection à la révocation d'une aide. Un ancien plan incohérent avec le net n'efface pas la dette : le relevé revient aux obligations.

Le moratoire est un plan daté, sans remise financière. Les dérogations pédagogiques restent distinctes. Le dossier 360°, le portail étudiant et les agrégats du dashboard utilisent cet échéancier effectif. Les plans n'ont pas pour effet automatique de rouvrir tous les droits pédagogiques : le service d'accès applique les règles institutionnelles.
