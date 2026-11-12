# Tarifs et facturation

`FeeTariffService` crée une version en brouillon, puis l'active après validation. Périmètre : année, programme facultatif, cycle facultatif, niveau facultatif, catégorie étudiante, code de frais et devise. Le programme et le niveau doivent être cohérents ; un agent limité à une faculté ne peut créer un tarif global hors périmètre.

Le hash normalisé `scope_key` et la version ont une contrainte unique. Le verrou de l'année sérialise la création/activation. Une période active qui chevauche une version du même périmètre exige `replace_id` explicite ; la version remplacée est archivée et auditée. La version elle-même reste immuable. Les tarifs plus spécifiques sont prioritaires : niveau, puis programme, puis cycle. Aucun cycle LMD n'est codé en dur.

La facturation se fait via `POST /dashboard/admin/finance/{academic}/bill` ou via le processus existant d'affectation des frais. Le service vérifie année, parcours, catégorie/devise, validité et autorisations. Chaque échéance émet une obligation avec instantané. Rejouer le même tarif ne recrée rien ; une autre version ne remplace pas des obligations existantes.

La source historique `LevelDetail` reste utilisable pour national/étranger dans sa devise configurée ; une modification future du niveau ne réécrit plus la facture émise. Il n'y a pas de facturation automatique universelle ajoutée à l'admission, aux documents ou à la candidature : les déclencheurs métier historiques sont conservés. Les obligations particulières restent possibles via l'action administrative existante et un motif audité.

L'interface `resources/js/pages/dashboard/finance/Index.tsx`, accessible à `/dashboard/admin/finance#tariffs`, permet création, activation et remplacement explicite. Les listes sont paginées ; un barème hors de la page courante se retrouve par pagination. Les erreurs de périmètre, devise, chevauchement ou dette déjà émise donnent une validation Laravel et aucun changement partiel.
